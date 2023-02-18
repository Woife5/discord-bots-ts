import { User, Log, GuildSettingsCache } from "@helpers";
import { ChannelType, Client } from "discord.js";
import { isToday } from "shared/lib/utils/date.util";
import { invalidateUserCache, updateUserBalance } from "helpers/user.util";
import { clientId } from "helpers/environment";
import { angryEmojis } from "@data";

const TAXATION_RATE = 0.07;
const log = new Log("Taxation");

export async function tax(client: Client) {
    const users = await User.find({ angryCoins: { $gt: 0 } }).exec();

    if (!users) {
        return;
    }

    let taxMoney = 0;

    const taxedUsers: [string, number][] = [];
    for (const user of users) {
        if (user.userId === clientId || isToday(user.lastTransaction)) {
            continue;
        }

        try {
            let taxationMoney = user.angryCoins * TAXATION_RATE;
            taxationMoney = Math.ceil(taxationMoney * (user.tarotreminder ? 0.5 : 1));
            user.angryCoins -= taxationMoney;
            taxMoney += taxationMoney;
            user.lastTransaction = new Date();
            taxedUsers.push([user.userName, taxationMoney]);
            await user.save();
            invalidateUserCache(user.userId);
        } catch (err) {
            log.error(err, "tax");
        }
    }

    if (taxMoney <= 0) {
        return;
    }

    await updateUserBalance({
        userId: clientId,
        amount: taxMoney,
        username: "Angry",
    });

    await broadcast(client, taxMoney, taxedUsers);
}

async function broadcast(client: Client, taxMoney: number, users: [string, number][]) {
    for (const [, guild] of client.guilds.cache) {
        try {
            const guildSettings = await GuildSettingsCache.get(guild.id);
            if (!guildSettings || !guildSettings.broadcastChannelId) {
                continue;
            }

            const channel = await client.channels.fetch(guildSettings.broadcastChannelId);
            if (channel?.type === ChannelType.GuildText) {
                await channel.send(
                    `The government has collected **${taxMoney}** angry coins in taxes. These have been collected from the following users: ${users
                        .map(u => `${u[0]}(**${u[1]}** ${angryEmojis[0]}s )`)
                        .join(", ")}\n\nThank you for your cooperation.`
                );
            } else {
                log.error(`Could not find broadcast channel for guild ${guild.id}`, "broadcast");
            }
        } catch (err) {
            log.error(err, "broadcast");
        }
    }
}
