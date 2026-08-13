import { dbClient } from "./db";
import type { SubscriptionKind } from "./subscriptions";

/**
 * Per-(channel, pipeline) summarization cursor. The message buffer is a
 * shared, non-destructive log (TTL-evicted after 24h), so each pipeline has
 * to remember how far it already summarized instead of clearing the buffer.
 */
export type SummaryStateDocument = {
    channelId: string;
    kind: SubscriptionKind;
    /**
     * `createdAt` of the newest message included in the last successful run.
     * The next run summarizes everything after this point. Only advanced on
     * success so a failed run does not discard conversation.
     */
    lastSummarizedThrough: Date;
    /**
     * When the last successful run completed. Drives due-run reconciliation
     * for the daily pipeline: a channel whose `lastRunAt` predates the most
     * recent 20:00 slot is retried until it succeeds.
     */
    lastRunAt: Date;
};

const summaryState = dbClient.collection<SummaryStateDocument>("summaryState");

export async function createSummaryStateIndexes() {
    await summaryState.createIndex({ channelId: 1, kind: 1 }, { unique: true });
}

export async function getSummaryState(channelId: string, kind: SubscriptionKind): Promise<SummaryStateDocument | null> {
    return summaryState.findOne({ channelId, kind });
}

/** Records a successful run. `lastSummarizedThrough` never moves backwards. */
export async function markSummarized(channelId: string, kind: SubscriptionKind, summarizedThrough: Date) {
    await summaryState.updateOne(
        { channelId, kind },
        {
            $max: { lastSummarizedThrough: summarizedThrough },
            $set: { lastRunAt: new Date() },
        },
        { upsert: true },
    );
}

/**
 * Records a run that consumed no messages. Only `lastRunAt` moves; the cursor
 * stays put so a message whose write is still in flight during the run cannot
 * be skipped past.
 */
export async function markRunCompleted(channelId: string, kind: SubscriptionKind) {
    await summaryState.updateOne(
        { channelId, kind },
        {
            $set: { lastRunAt: new Date() },
            $setOnInsert: { lastSummarizedThrough: new Date(0) },
        },
        { upsert: true },
    );
}
