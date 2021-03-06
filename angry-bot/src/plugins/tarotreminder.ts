import { Client } from "discord.js";
import { User, NumberUtils, Log } from "@helpers";
import { tarotReminders } from "@data";

const log = new Log("TarotReminder");

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
            await member.send(tarotReminders[NumberUtils.getRandomInt(0, tarotReminders.length - 1)]);
        } catch (err) {
            log.error(err);
        }
    }
}
