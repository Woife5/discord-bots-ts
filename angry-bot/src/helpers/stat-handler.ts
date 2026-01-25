import type { User as DiscordUser } from "discord.js";
import { type StatKeys, Stats, User } from "./db-helpers";
import { invalidateUserCache } from "./user.util";

export async function incrementStat(key: StatKeys, amount = 1) {
    try {
        await Stats.findOneAndUpdate({ key }, { $inc: { value: amount } }, { upsert: true }).exec();
    } catch (err) {
        console.error("incrementStat", err);
    }
}

export async function incrementStatAndUser(key: StatKeys, user: DiscordUser, amount = 1) {
    try {
        await Stats.findOneAndUpdate({ key }, { $inc: { value: amount } }, { upsert: true }).exec();
        await User.findOneAndUpdate({ userId: user.id }, { $inc: { [`stats.${key}`]: amount } }).exec();
        invalidateUserCache(user.id);
    } catch (err) {
        console.error("incrementStatAndUser", err);
    }
}
