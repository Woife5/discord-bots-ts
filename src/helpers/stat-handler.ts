import { Stats, User, StatKeys } from './db-helpers';
import { User as DiscordUser } from 'discord.js';

export async function incrementStat(key: StatKeys, amount: number = 1) {
    try {
        await Stats.findOneAndUpdate({ key }, { $inc: { value: amount } }, { upsert: true, new: true }).exec();
    } catch (err) {
        console.error(err);
    }
}

export async function incrementStatAndUser(key: StatKeys, user: DiscordUser, amount: number = 1) {
    try {
        await Stats.findOneAndUpdate({ key }, { $inc: { value: amount } }, { upsert: true, new: true }).exec();
        await User.findOneAndUpdate(
            { userId: user.id },
            { $inc: { ['stats.' + key]: amount } },
            { upsert: true, new: true }
        ).exec();
    } catch (err) {
        console.error(err);
    }
}
