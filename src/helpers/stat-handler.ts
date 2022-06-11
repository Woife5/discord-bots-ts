import { Stats, User, StatKeys, log } from './db-helpers';
import { User as DiscordUser } from 'discord.js';

export async function incrementStat(key: StatKeys, amount: number = 1) {
    try {
        await Stats.findOneAndUpdate({ key }, { $inc: { value: amount } }, { upsert: true }).exec();
    } catch (err) {
        log.error(err, 'StatsHandler.incrementStat');
    }
}

export async function incrementStatAndUser(key: StatKeys, user: DiscordUser, amount: number = 1) {
    try {
        await Stats.findOneAndUpdate({ key }, { $inc: { value: amount } }, { upsert: true }).exec();
        await User.findOneAndUpdate({ userId: user.id }, { $inc: { ['stats.' + key]: amount } }).exec();
    } catch (err) {
        log.error(err, 'StatsHandler.incrementStatAndUser');
    }
}
