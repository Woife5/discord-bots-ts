import { Client } from 'discord.js';
import { User, NumberUtils } from '@helpers';
import { tarotReminders } from '@data';

export async function remind(client: Client) {
    const users = await User.find({
        lastTarot: { $lt: new Date().setHours(0, 0, 0, 0) },
        tarotreminder: true,
    }).exec();

    if (!users) {
        return;
    }

    for (const user of users) {
        try {
            const member = await client.users.fetch(user.userId);
            member.send(tarotReminders[NumberUtils.getRandomInt(0, tarotReminders.length - 1)]);
        } catch (err) {
            console.error(err);
        }
    }
}
