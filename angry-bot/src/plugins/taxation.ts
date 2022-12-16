import { User, Log, GuildSettingsCache } from "@helpers";
import { ChannelType, Client } from "discord.js";
import { isToday } from "shared/lib/utils/date.util";
import { updateUserBalance } from "helpers/user.util";
import { clientId } from "helpers/environment";

const TAXATION_RATE = 0.05;
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
            const taxationMoney = Math.ceil(user.angryCoins * TAXATION_RATE);
            user.angryCoins -= taxationMoney;
            taxMoney += taxationMoney;
            user.lastTransaction = new Date();
            taxedUsers.push([user.userName, taxationMoney]);
            await user.save();
        } catch (err) {
            log.error(err);
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
        const guildSettings = await GuildSettingsCache.get(guild.id);
        if (!guildSettings) {
            continue;
        }

        const channel = await client.channels.fetch(guildSettings.broadcastChannelId);
        if (channel?.type === ChannelType.GuildText) {
            channel.send(
                `The government has collected **${taxMoney}** angry coins in taxes. These have been collected from the following users: ${users
                    .map(u => `${u[0]}(**${u[1]}$**)`)
                    .join(", ")}\n\nThank you for your cooperation.`
            );
        } else {
            log.error(`Could not find broadcast channel for guild ${guild.id}`);
        }
    }
}
