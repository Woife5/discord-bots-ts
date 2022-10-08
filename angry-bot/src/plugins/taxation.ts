import { User, Log, updateUserBalance, DateUtils } from "@helpers";
import { ChannelType, Client } from "discord.js";

const TAXATION_RATE = 0.1;
const broadcastChannelId = "824231030494986262";
const log = new Log("Taxation");

export async function tax(client: Client) {
    const users = await User.find({ angryCoins: { $gt: 0 } }).exec();

    if (!users) {
        return;
    }

    let taxMoney = 0;

    for (const user of users) {
        if (user.userId === process.env.CLIENT_ID || !user.lastTransaction || DateUtils.isToday(user.lastTransaction)) {
            continue;
        }

        try {
            const taxationMoney = Math.ceil(user.angryCoins * TAXATION_RATE);
            user.angryCoins -= taxationMoney;
            taxMoney += taxationMoney;
            user.lastTransaction = new Date();
            await user.save();
        } catch (err) {
            log.error(err);
        }
    }

    const angryId = process.env.CLIENT_ID;

    if (taxMoney <= 0 || !angryId) {
        return;
    }

    const channel = await client.channels.fetch(broadcastChannelId);
    if (channel?.type === ChannelType.GuildText) {
        channel.send(
            `The government has collected **${taxMoney}** angry coins in taxes. These have been collected from the following users: ${users
                .map(u => u.userName)
                .join(", ")}\n\nThank you for your cooperation.`
        );
    } else {
        log.error("Could not find broadcast channel");
    }

    await updateUserBalance({
        userId: angryId,
        amount: taxMoney,
        username: "Angry",
    });
}
