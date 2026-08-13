import type { Snowflake } from "discord.js";
import type { MessageContext } from "../extract";
import { dbClient } from "./db";

/**
 * A single buffered message. Keyed by the Discord message id so gateway
 * events (create, update, delete) can be applied idempotently - Discord
 * explicitly allows duplicated and missing events.
 */
export type BufferedMessage = {
    _id: Snowflake;
    /** Channel the message was actually sent in (a thread id for thread messages). */
    channelId: Snowflake;
    /** Registered channel this message rolls up into (thread parent, or channelId). */
    rootChannelId: Snowflake;
    guildId: Snowflake;
    authorId: Snowflake;
    author: string;
    createdAt: Date;
    content: string;
    /**
     * Replies, forwards, media, links, polls and reactions, captured at ingest
     * time because signed attachment URLs expire and referenced messages can
     * be deleted before the summary runs.
     */
    context?: MessageContext;
    editedAt?: Date;
    deleted?: boolean;
    expiresAt: Date;
};

const BUFFER_TTL_MS = 24 * 60 * 60 * 1000;

const messages = dbClient.collection<BufferedMessage>("messageBuffer");

export async function createMessageBufferIndexes() {
    // TTL index so the collection cleans itself up even if a summary never runs.
    await messages.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await messages.createIndex({ rootChannelId: 1, createdAt: 1 });
}

export function bufferExpiry(from: Date = new Date()): Date {
    return new Date(from.getTime() + BUFFER_TTL_MS);
}

/**
 * Inserts or replaces a buffered message. Safe to call repeatedly for the
 * same message id.
 */
export async function upsertMessage(message: BufferedMessage) {
    await messages.replaceOne({ _id: message._id }, message, { upsert: true });
}

/**
 * Marks a message as deleted instead of removing it. Keeping a tombstone lets
 * the summary state that something was withdrawn rather than silently
 * misrepresenting the conversation.
 */
export async function tombstoneMessages(messageIds: Array<Snowflake>) {
    if (messageIds.length === 0) {
        return;
    }

    await messages.updateMany({ _id: { $in: messageIds } }, { $set: { deleted: true } });
}

/**
 * Looks up a single buffered message, used to resolve a reply target without
 * spending an API request.
 */
export async function findBufferedMessage(messageId: Snowflake): Promise<BufferedMessage | null> {
    return messages.findOne({ _id: messageId });
}

/**
 * Buffered messages of a channel newer than `after`, oldest first. The buffer
 * is shared between pipelines and never cleared (the TTL index evicts it), so
 * each caller passes its own cursor.
 */
export async function getBufferSince(rootChannelId: Snowflake, after?: Date): Promise<Array<BufferedMessage>> {
    const filter = after ? { rootChannelId, createdAt: { $gt: after } } : { rootChannelId };
    return messages.find(filter).sort({ createdAt: 1 }).toArray();
}

/**
 * Every buffered root channel with the timestamp of its newest message. Used
 * on startup to rebuild inactivity timers, which do not survive a restart.
 */
export async function findBufferedRootChannels(): Promise<Array<{ rootChannelId: Snowflake; lastMessageAt: Date }>> {
    const grouped = await messages
        .aggregate<{ _id: Snowflake; lastMessageAt: Date }>([
            { $group: { _id: "$rootChannelId", lastMessageAt: { $max: "$createdAt" } } },
        ])
        .toArray();

    return grouped.map((entry) => ({ rootChannelId: entry._id, lastMessageAt: entry.lastMessageAt }));
}
