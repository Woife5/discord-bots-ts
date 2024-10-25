import { tarotReminders } from "@data";
import { GuildSettingsCache, Log, User } from "@helpers";
import { getRandomInt } from "@woife5/shared/lib/utils/number.util";
import { ChannelType, type Client } from "discord.js";

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
            await member.send(tarotReminders[getRandomInt(0, tarotReminders.length - 1)]);
        } catch {
            // ignored -> user has disabled direct messages
        }
    }

    await broadcast(
        client,
        users.map((u) => u.userId),
    );
}

async function broadcast(client: Client, userIds: string[]) {
    for (const [, guild] of client.guilds.cache) {
        const guildSettings = await GuildSettingsCache.get(guild.id);
        if (!guildSettings || !guildSettings.broadcastChannelId) {
            continue;
        }

        try {
            const channel = await client.channels.fetch(guildSettings.broadcastChannelId);
            if (channel?.type === ChannelType.GuildText) {
                await channel.send(
                    `What a shame, these people have not yet had their tarot reading today:\n${userIds
                        .map((id) => `<@${id}>`)
                        .join(", ")}\n\nDisappointing.`,
                );
            } else {
                log.error(`Could not find broadcast channel for guild ${guild.id}`, "broadcast");
            }
        } catch (err) {
            log.error(err, "broadcast");
        }
    }
}
