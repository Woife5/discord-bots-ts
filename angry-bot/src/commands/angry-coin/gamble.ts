import { SlashCommandBuilder } from "@discordjs/builders";
import { incrementStatAndUser } from "@helpers";
import { angryCoinEmbed } from "commands/embeds";
import { ChatInputCommandInteraction, User as DiscordUser } from "discord.js";
import { clientId } from "@woife5/shared/lib/utils/env.util";
import { getUserActionCache, getUserBalance, updateUserActionCache, updateUserBalance } from "helpers/user.util";
import { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { getRandomInt } from "@woife5/shared/lib/utils/number.util";

export const gamble: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("gamble")
        .setDescription("Gamble away a portion of your angry coins.")
        .addStringOption(option =>
            option
                .setName("amount")
                .setDescription("The amount of coins you want to gamble or `all`, if you are feeling very lucky ;)")
                .setRequired(true)
        ),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const amountStr = interaction.options.getString("amount") ?? "";
        const amount = parseInt(amountStr, 10);

        const all = amountStr === "all";

        interaction.reply({ embeds: [await runCommand(interaction.user, amount, all)] });
    },
};

async function runCommand(user: DiscordUser, amount: number, all: boolean) {
    const userBalance = await getUserBalance(user.id);

    if (all) {
        amount = userBalance;
    }

    if (isNaN(amount) || amount <= 0 || amount > userBalance) {
        return angryCoinEmbed()
            .setTitle("Gamble")
            .setDescription(
                "Invalid amount! You have to gamble a positive amount of coins that you own (debt maybe coming soon)."
            );
    }

    const embed = angryCoinEmbed().addFields({ name: "Gambling", value: `You gambled ${amount} angry coins` });

    let upperLimit = 1;

    const userCache = getUserActionCache(user.id);
    if (userCache && userCache.gambles > 4) {
        upperLimit = 7;
    }
    updateUserActionCache(user.id, { gambles: 1 });

    const win = getRandomInt(0, upperLimit) === 0;
    const taxPayed = !win && amount >= userBalance / 10;
    await updateBalance(user, win ? amount : -amount, taxPayed);

    if (win) {
        embed.setColor("Green");
        embed.addFields({
            name: "Outcome",
            value: `You won ${amount * 2} angry coins! Good job! :money_mouth: :moneybag::moneybag::moneybag:`,
        });
        return embed;
    }

    embed.setColor("Red");
    embed.addFields({ name: "Outcome", value: "You lost all your coins :( Better luck next time!" });
    return embed;
}

async function updateBalance(discordUser: DiscordUser, amount: number, taxPayed: boolean) {
    await updateUserBalance({ userId: discordUser.id, amount, username: discordUser.username, taxPayed });
    await updateUserBalance({ userId: clientId, amount: -amount, username: "Angry" });
    if (amount < 0) {
        await incrementStatAndUser("money-lost-in-gambling", discordUser, -amount);
    } else {
        await incrementStatAndUser("money-won-in-gambling", discordUser, amount);
    }
}
