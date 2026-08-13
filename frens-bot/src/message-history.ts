import { ChannelType, type Snowflake } from "discord.js";
import {
    type BufferedMessage,
    bufferExpiry,
    findBufferedMessage,
    tombstoneMessages,
    upsertMessage,
} from "./database/message-buffer";
import { isChannelWatched } from "./database/subscriptions";
import { extractContext, type GuildMessage, type ReplyContext } from "./extract";
import { noteChannelActivity, restoreDmTimers, stopDmTimers } from "./pipelines/dm-inactivity";
import { awaitPending, track } from "./pipelines/pending";

let acceptingMessages = true;

/**
 * Registered channel a message rolls up into. Messages inside a thread report
 * the thread id as their channelId, so they have to be mapped to the parent
 * for the parent's subscriptions to match.
 */
export function getRootChannelId(message: GuildMessage): Snowflake {
    const channel = message.channel;
    if (channel.isThread()) {
        return channel.parentId ?? channel.id;
    }
    return channel.id;
}

/**
 * Private threads are visible only to their members, but summaries are
 * delivered based on the parent channel's audience (DM subscribers with
 * parent access, or the parent channel itself). Buffering them would leak
 * their content to people who cannot read the thread.
 */
function isPrivateThread(message: GuildMessage): boolean {
    return message.channel.type === ChannelType.PrivateThread;
}

/**
 * Tracks an ingestion write so shutdown can await it before closing the
 * database connection.
 */
function tracked<T>(promise: Promise<T>): Promise<T> {
    track(promise);
    return promise;
}

export function addMessage(message: GuildMessage): Promise<void> {
    return tracked(doAddMessage(message));
}

async function doAddMessage(message: GuildMessage) {
    if (!acceptingMessages || isPrivateThread(message)) {
        return;
    }

    const rootChannelId = getRootChannelId(message);

    // Skip if no pipeline is interested in this channel
    if (!(await isChannelWatched(rootChannelId))) {
        return;
    }

    await upsertMessage(await toBufferedMessage(message, rootChannelId));
    noteChannelActivity(message.client, rootChannelId);
}

/**
 * Applies an edit. Also catches embeds that Discord attaches after the
 * message was originally created, such as link and GIF previews.
 */
export function updateMessage(message: GuildMessage): Promise<void> {
    return tracked(doUpdateMessage(message));
}

async function doUpdateMessage(message: GuildMessage) {
    if (!acceptingMessages || isPrivateThread(message)) {
        return;
    }

    const rootChannelId = getRootChannelId(message);
    if (!(await isChannelWatched(rootChannelId))) {
        return;
    }

    await upsertMessage(await toBufferedMessage(message, rootChannelId));
}

export function removeMessages(messageIds: Array<Snowflake>): Promise<void> {
    return tracked(tombstoneMessages(messageIds));
}

async function toBufferedMessage(message: GuildMessage, rootChannelId: Snowflake): Promise<BufferedMessage> {
    const createdAt = message.createdAt;
    const context = await extractContext(message, resolveBufferedReply);

    return {
        _id: message.id,
        channelId: message.channelId,
        rootChannelId,
        guildId: message.guildId,
        authorId: message.author.id,
        author: message.author.displayName,
        createdAt,
        content: message.cleanContent,
        context,
        ...(message.editedAt ? { editedAt: message.editedAt } : {}),
        expiresAt: bufferExpiry(createdAt),
    };
}

/**
 * Answers a reply lookup from the buffer so the common case of replying to a
 * recent message costs no API request.
 */
async function resolveBufferedReply(messageId: Snowflake): Promise<ReplyContext | undefined> {
    const buffered = await findBufferedMessage(messageId);
    if (!buffered) {
        return undefined;
    }

    const excerpt = buffered.content.trim().replace(/\s+/g, " ");

    return {
        messageId,
        author: buffered.author,
        ...(excerpt.length > 0 ? { excerpt: excerpt.length > 120 ? `${excerpt.slice(0, 119)}…` : excerpt } : {}),
    };
}

export { restoreDmTimers as restoreBuffers };

/**
 * Stops accepting new messages and waits for in-flight summaries. Buffered
 * messages stay in MongoDB and are picked up again by `restoreBuffers`, so a
 * redeploy no longer loses buffered conversation.
 */
export async function shutdown() {
    acceptingMessages = false;
    stopDmTimers();
    await awaitPending();
}
