import { type Client, channelMention, PermissionFlagsBits, type Snowflake } from "discord.js";
import { inactivityTimeoutMs } from "../constants";
import { findBufferedRootChannels, getBufferSince } from "../database/message-buffer";
import { getDmSubscribers } from "../database/subscriptions";
import { getSummaryState, markSummarized } from "../database/summary-state";
import { newestMessageTime, summarizeMessages } from "../summarize/core";
import { chunkForDiscord } from "../util/chunk";
import { track } from "./pending";
import { resolveChannel } from "./resolve-channel";

/** Inactivity timers only. All message state lives in MongoDB. */
const timers = new Map<Snowflake, NodeJS.Timeout>();

/**
 * (Re)starts the inactivity countdown of a channel. Called by the capture
 * layer for every recorded message.
 */
export function noteChannelActivity(
    client: Client<true>,
    rootChannelId: Snowflake,
    delayMs: number = inactivityTimeoutMs,
) {
    clearTimeout(timers.get(rootChannelId));

    const timeout = setTimeout(
        () => {
            timers.delete(rootChannelId);
            track(
                summarizeForDmSubscribers(client, rootChannelId).catch((error) => {
                    console.error(`Failed to summarize channel ${rootChannelId}`, error);
                }),
            );
        },
        Math.max(delayMs, 0),
    );

    timers.set(rootChannelId, timeout);
}

/**
 * Rebuilds inactivity timers for buffers left behind by a previous process.
 * Timers do not survive a restart, so without this a buffer could sit in
 * MongoDB until its TTL removed it unsummarized.
 */
export async function restoreDmTimers(client: Client<true>) {
    const buffered = await findBufferedRootChannels();
    let restored = 0;

    for (const { rootChannelId, lastMessageAt } of buffered) {
        // Skip channels whose buffered messages were all summarized already.
        const state = await getSummaryState(rootChannelId, "dm");
        if (state && state.lastSummarizedThrough >= lastMessageAt) {
            continue;
        }

        const elapsed = Date.now() - lastMessageAt.getTime();
        noteChannelActivity(client, rootChannelId, inactivityTimeoutMs - elapsed);
        restored++;
    }

    if (restored > 0) {
        console.log(`Restored ${restored} buffered channel(s)`);
    }
}

async function summarizeForDmSubscribers(client: Client<true>, rootChannelId: Snowflake) {
    const toNotify = await getDmSubscribers(rootChannelId);
    if (toNotify.length === 0) {
        // The channel may still be buffered for the daily pipeline, so the
        // cursor is left untouched and nothing is discarded.
        return;
    }

    const state = await getSummaryState(rootChannelId, "dm");
    const window = await getBufferSince(rootChannelId, state?.lastSummarizedThrough);
    const summarizedThrough = newestMessageTime(window);
    if (!summarizedThrough) {
        return;
    }

    const outcome = await summarizeMessages(window);

    // Advance the cursor only after a successful run so a transient LLM
    // failure does not silently discard the conversation. Too-small windows
    // are consumed as well, mirroring the previous buffer-clearing behavior.
    await markSummarized(rootChannelId, "dm", summarizedThrough);

    if (outcome.kind === "too-few") {
        return;
    }

    if (!outcome.result.significant) {
        console.log(`Nothing relevant to summarize in channel ${rootChannelId}`);
        return;
    }

    const guildId = window[0]?.guildId;
    if (!guildId) {
        return;
    }

    const { guild, channel } = await resolveChannel(client, guildId, rootChannelId);
    const body = `${channelMention(rootChannelId)}\n${outcome.result.summary}`;
    const chunks = chunkForDiscord(body);

    for (const userId of toNotify) {
        try {
            const member = await guild.members.fetch(userId);
            if (!channel.permissionsFor(member)?.has(PermissionFlagsBits.ViewChannel)) {
                console.warn("Skipped summary for user without channel access", userId, rootChannelId);
                continue;
            }

            for (const chunk of chunks) {
                await member.send({ content: chunk, allowedMentions: { parse: [] } });
            }
            console.log(`Sent summary for channel ${rootChannelId} to ${userId}`);
        } catch (error) {
            console.error("Could not send summary to user", userId, error);
        }
    }
}

export function stopDmTimers() {
    for (const timeout of timers.values()) {
        clearTimeout(timeout);
    }
    timers.clear();
}
