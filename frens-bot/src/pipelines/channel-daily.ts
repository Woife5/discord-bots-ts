import { type Client, channelMention } from "discord.js";
import { type ScheduledTask, schedule } from "node-cron";
import { getBufferSince } from "../database/message-buffer";
import { getDailySubscriptions, type SubscriptionDocument } from "../database/subscriptions";
import { getSummaryState, markRunCompleted, markSummarized } from "../database/summary-state";
import { newestMessageTime, summarizeMessages } from "../summarize/core";
import { chunkForDiscord } from "../util/chunk";
import { track } from "./pending";
import { resolveChannel } from "./resolve-channel";

const TIMEZONE = "Europe/Vienna";
const SCHEDULED_HOUR = 20;

let tasks: Array<ScheduledTask> = [];

/**
 * Starts the daily summary scheduler. A single hourly sweep covers the main
 * 20:00 slot (the sweep fires exactly at 20:00 too) as well as retries of
 * failed runs; `latestScheduledTime` keeps every other tick a no-op.
 */
export function startDailyScheduler(client: Client<true>) {
    tasks = [schedule("0 * * * *", () => queueDueDailySummaries(client), { timezone: TIMEZONE })];

    // Catch up on runs missed while the process was down.
    queueDueDailySummaries(client);
}

export function stopDailyScheduler() {
    for (const task of tasks) {
        task.stop();
    }
    tasks = [];
}

let sweepInFlight = false;

function queueDueDailySummaries(client: Client<true>) {
    // The startup call and an hourly tick (or a long-running LLM retry and
    // the next tick) can overlap; a second concurrent sweep would observe
    // stale state and post duplicate summaries.
    if (sweepInFlight) {
        return;
    }
    sweepInFlight = true;

    track(
        runDueDailySummaries(client)
            .catch((error) => {
                console.error("Daily summary sweep failed", error);
            })
            .finally(() => {
                sweepInFlight = false;
            }),
    );
}

/**
 * Idempotent reconciler: runs the daily summary for every subscribed channel
 * whose last successful run predates the most recent 20:00 slot. Safe to call
 * at any time; failures leave the channel due and are retried by the next
 * hourly sweep.
 */
export async function runDueDailySummaries(client: Client<true>) {
    const due = latestScheduledTime();
    const subscriptions = await getDailySubscriptions();

    for (const subscription of subscriptions) {
        try {
            // A subscription created after the current slot is not due yet;
            // its first summary is the next 20:00 after subscribing.
            if (subscription.createdAt > due) {
                continue;
            }

            const state = await getSummaryState(subscription.channelId, "channel-daily");
            if (state && state.lastRunAt >= due) {
                continue;
            }

            await runDailySummary(client, subscription);
        } catch (error) {
            console.error(`Daily summary failed for channel ${subscription.channelId}`, error);
        }
    }
}

async function runDailySummary(client: Client<true>, subscription: SubscriptionDocument) {
    const { channelId, guildId } = subscription;

    const state = await getSummaryState(channelId, "channel-daily");
    const window = await getBufferSince(channelId, state?.lastSummarizedThrough);
    const summarizedThrough = newestMessageTime(window);

    if (!summarizedThrough) {
        // Nothing buffered. Record the run so the sweep stops retrying today,
        // without touching the cursor.
        await markRunCompleted(channelId, "channel-daily");
        return;
    }

    const outcome = await summarizeMessages(window);

    if (outcome.kind === "summarized" && outcome.result.significant) {
        const resolvedGuildId = guildId ?? window[0]?.guildId;
        if (!resolvedGuildId) {
            throw new Error(`No guild known for daily summary channel ${channelId}`);
        }

        const { channel } = await resolveChannel(client, resolvedGuildId, channelId);
        if (!channel.isTextBased()) {
            throw new Error(`Daily summary channel ${channelId} is not text based`);
        }

        const body = `**Daily summary** ${channelMention(channelId)}\n${outcome.result.summary}`;
        for (const chunk of chunkForDiscord(body)) {
            await channel.send({ content: chunk, allowedMentions: { parse: [] } });
        }
        console.log(`Posted daily summary in channel ${channelId}`);
    }

    // Success (including "too few" and "nothing relevant"): advance the
    // cursor and record the run. Failures throw before this point, keeping
    // the channel due for the next hourly sweep.
    await markSummarized(channelId, "channel-daily", summarizedThrough);
}

/** The most recent 20:00 Europe/Vienna that is not in the future. */
export function latestScheduledTime(now: Date = new Date()): Date {
    const vienna = viennaParts(now);
    let slot = viennaWallTimeToUtc(vienna.year, vienna.month, vienna.day, SCHEDULED_HOUR);

    if (slot > now) {
        const previousDay = new Date(slot.getTime() - 24 * 60 * 60 * 1000);
        const parts = viennaParts(previousDay);
        slot = viennaWallTimeToUtc(parts.year, parts.month, parts.day, SCHEDULED_HOUR);
    }

    return slot;
}

const viennaFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Vienna",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
});

function viennaParts(date: Date) {
    const parts: Record<string, number> = {};
    for (const part of viennaFormatter.formatToParts(date)) {
        if (part.type !== "literal") {
            parts[part.type] = Number(part.value);
        }
    }
    return { year: parts.year ?? 0, month: parts.month ?? 1, day: parts.day ?? 1, hour: parts.hour ?? 0 };
}

/**
 * Converts a Europe/Vienna wall-clock time to UTC. Starts from the UTC guess
 * and corrects by the formatter round-trip difference, which converges in one
 * step for fixed-offset periods (CET/CEST).
 */
function viennaWallTimeToUtc(year: number, month: number, day: number, hour: number): Date {
    let utc = new Date(Date.UTC(year, month - 1, day, hour));

    for (let i = 0; i < 2; i++) {
        const roundTrip = viennaParts(utc);
        const diffMs =
            Date.UTC(year, month - 1, day, hour) -
            Date.UTC(roundTrip.year, roundTrip.month - 1, roundTrip.day, roundTrip.hour);
        if (diffMs === 0) {
            break;
        }
        utc = new Date(utc.getTime() + diffMs);
    }

    return utc;
}
