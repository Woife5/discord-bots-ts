import { Client } from 'discord.js';
import { User } from '../helpers';

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
            member.send('You have a reminder from the Tarot Bot!');
        } catch (err) {
            console.error(err);
        }
    }
}
