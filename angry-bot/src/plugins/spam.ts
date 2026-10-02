import { type ISpam, isDue, SpamDB, type SpamSchedule, toHourSlot } from "@helpers";
import { type Client, DiscordAPIError, RESTJSONErrorCodes } from "discord.js";
import type { HydratedDocument } from "mongoose";

const HOUR_MS = 60 * 60 * 1000;

// Errors after which a spam can never be sent again, so it gets removed
const FATAL_ERROR_CODES: number[] = [
    RESTJSONErrorCodes.UnknownChannel,
    RESTJSONErrorCodes.MissingAccess,
    RESTJSONErrorCodes.MissingPermissions,
];

let spams: HydratedDocument<ISpam>[] = [];
let initialized = false;
let lastSlot = 0;

/**
 * Loads all spams from the database and checks every full hour which of them are due.
 * A plain timer is used instead of node-cron, as node-cron fires repeatedly when the clocks go back.
 */
export async function init(client: Client) {
    if (initialized) {
        return;
    }
    initialized = true;

    await reload();

    const tick = async () => {
        setTimeout(tick, Math.ceil((Date.now() + 1) / HOUR_MS) * HOUR_MS - Date.now());

        const slot = toHourSlot(new Date());
        if (slot.getTime() === lastSlot) {
            return;
        }
        lastSlot = slot.getTime();

        await run(client, slot);
    };

    setTimeout(tick, Math.ceil(Date.now() / HOUR_MS) * HOUR_MS - Date.now());
}

export async function reload() {
    spams = await SpamDB.find({}).exec();
}

export function getByGuild(guildId: string) {
    return spams.filter((s) => s.guildId === guildId);
}

export function toSchedule(spam: ISpam): SpamSchedule | null {
    if (spam.type === "date" && spam.day && spam.month && spam.hour !== undefined) {
        return { type: "date", day: spam.day, month: spam.month, hour: spam.hour };
    }

    if (spam.type === "interval" && spam.every && spam.unit && spam.startAt) {
        return { type: "interval", every: spam.every, unit: spam.unit, startAt: spam.startAt };
    }

    return null;
}

async function run(client: Client, slot: Date) {
    for (const spam of spams) {
        const spamSchedule = toSchedule(spam);
        if (!spamSchedule) {
            console.warn(`Spam ${spam.id} has an invalid schedule, skipping.`);
            continue;
        }

        if (isDue(spamSchedule, slot)) {
            await send(client, spam);
        }
    }
}

async function send(client: Client, spam: HydratedDocument<ISpam>) {
    try {
        const channel = await client.channels.fetch(spam.channelId);
        if (!channel?.isSendable()) {
            console.warn(`Spam ${spam.id}: channel ${spam.channelId} is not available, skipping.`);
            return;
        }

        await channel.send({ content: spam.message, allowedMentions: { parse: [] } });
    } catch (error) {
        if (
            error instanceof DiscordAPIError &&
            typeof error.code === "number" &&
            FATAL_ERROR_CODES.includes(error.code)
        ) {
            console.warn(`Spam ${spam.id}: channel ${spam.channelId} is no longer accessible, removing spam.`);
            await SpamDB.deleteOne({ _id: spam._id }).exec();
            await reload();
            return;
        }

        console.warn(`Spam ${spam.id}: could not be sent.`, error);
    }
}
