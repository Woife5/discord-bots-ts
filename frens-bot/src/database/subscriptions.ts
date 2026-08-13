import { dbClient } from "./db";

/**
 * A subscription to summaries of a channel.
 *
 * - `dm`: a user receives a private summary after a discussion in the channel
 *   goes quiet. One document per (channel, user).
 * - `channel-daily`: the channel itself receives a daily summary at 20:00.
 *   `userId` is null so the unique index allows at most one per channel.
 */
export type SubscriptionKind = "dm" | "channel-daily";

export type SubscriptionDocument = {
    channelId: string;
    kind: SubscriptionKind;
    userId: string | null;
    guildId: string | null;
    createdAt: Date;
};

type CacheEntry = {
    value: Array<SubscriptionDocument>;
    expiresAt: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;

const subscriptions = dbClient.collection<SubscriptionDocument>("subscriptions");
const cache = new Map<string, CacheEntry>();

export async function createSubscriptionIndexes() {
    await subscriptions.createIndex({ channelId: 1, kind: 1, userId: 1 }, { unique: true });
    await subscriptions.createIndex({ kind: 1 });
}

/** All subscriptions of a channel, cached because it gates every gateway message. */
export async function getChannelSubscriptions(channelId: string): Promise<Array<SubscriptionDocument>> {
    const cached = cache.get(channelId);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
    }

    const value = await subscriptions.find({ channelId }).project<SubscriptionDocument>({ _id: 0 }).toArray();

    setCached(channelId, value);
    return value;
}

/** Whether any pipeline needs messages of this channel buffered. */
export async function isChannelWatched(channelId: string): Promise<boolean> {
    const subs = await getChannelSubscriptions(channelId);
    return subs.length > 0;
}

/** DM subscribers of a channel. */
export async function getDmSubscribers(channelId: string): Promise<Array<string>> {
    const subs = await getChannelSubscriptions(channelId);
    return subs.filter((sub) => sub.kind === "dm" && sub.userId !== null).map((sub) => sub.userId as string);
}

/** Every channel that receives a daily summary. Uncached; only the cron reads it. */
export async function getDailySubscriptions(): Promise<Array<SubscriptionDocument>> {
    return subscriptions.find({ kind: "channel-daily" }).project<SubscriptionDocument>({ _id: 0 }).toArray();
}

function setCached(channelId: string, value: Array<SubscriptionDocument>) {
    // Drop the oldest entry first so the bot cannot accumulate an entry for
    // every channel it has ever seen.
    if (cache.size >= CACHE_MAX_ENTRIES && !cache.has(channelId)) {
        const oldest = cache.keys().next();
        if (!oldest.done) {
            cache.delete(oldest.value);
        }
    }

    cache.set(channelId, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function subscribeDm(userId: string, channelId: string): Promise<boolean> {
    return upsertSubscription({ channelId, kind: "dm", userId, guildId: null });
}

export async function unsubscribeDm(userId: string, channelId: string): Promise<boolean> {
    return deleteSubscription({ channelId, kind: "dm", userId });
}

export async function subscribeChannelDaily(channelId: string, guildId: string): Promise<boolean> {
    return upsertSubscription({ channelId, kind: "channel-daily", userId: null, guildId });
}

export async function unsubscribeChannelDaily(channelId: string): Promise<boolean> {
    return deleteSubscription({ channelId, kind: "channel-daily", userId: null });
}

async function upsertSubscription(subscription: Omit<SubscriptionDocument, "createdAt">): Promise<boolean> {
    const { channelId, kind, userId } = subscription;
    const result = await subscriptions.updateOne(
        { channelId, kind, userId },
        { $setOnInsert: { ...subscription, createdAt: new Date() } },
        { upsert: true },
    );
    cache.delete(channelId);
    return result.upsertedCount === 1;
}

async function deleteSubscription(filter: Pick<SubscriptionDocument, "channelId" | "kind" | "userId">) {
    const result = await subscriptions.deleteOne(filter);
    cache.delete(filter.channelId);
    return result.deletedCount === 1;
}
