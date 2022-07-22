import { Stats, User, StatKeys, Log } from "./db-helpers";
import { User as DiscordUser } from "discord.js";

const log = new Log("StatHandler");

export async function incrementStat(key: StatKeys, amount = 1) {
    try {
        await Stats.findOneAndUpdate({ key }, { $inc: { value: amount } }, { upsert: true }).exec();
    } catch (err) {
        log.error(err, "incrementStat");
    }
}

export async function incrementStatAndUser(key: StatKeys, user: DiscordUser, amount = 1) {
    try {
        await Stats.findOneAndUpdate({ key }, { $inc: { value: amount } }, { upsert: true }).exec();
        await User.findOneAndUpdate({ userId: user.id }, { $inc: { ["stats." + key]: amount } }).exec();
    } catch (err) {
        log.error(err, "incrementStatAndUser");
    }
}
