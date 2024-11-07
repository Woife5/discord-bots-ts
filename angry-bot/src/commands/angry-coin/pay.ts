import type { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { clientId } from "@woife5/shared/lib/utils/env.util";
import { getRandomInt } from "@woife5/shared/lib/utils/number.util";
import { angryCoinEmbed, errorEmbed } from "commands/embeds";
import { type ChatInputCommandInteraction, type User as DiscordUser, SlashCommandBuilder } from "discord.js";
import { getUserBalance, updateUserBalance } from "helpers/user.util";

export const pay: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("pay")
        .setDescription("Pay another user some angry coins.")
        .addUserOption((option) => option.setName("user").setDescription("The user to pay.").setRequired(true))
        .addStringOption((option) =>
            option
                .setName("amount")
                .setDescription(
                    "The amount of angry coins you want to pay or `all` if you want to send all of your coins.",
                )
                .setRequired(true),
        ),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const from = interaction.user;
        const to = interaction.options.getUser("user", true);
        const amount = interaction.options.getString("amount", true);
        interaction.reply({ embeds: [await runCommand(from, to, amount)] });
    },
};

async function runCommand(from: DiscordUser, to: DiscordUser, amountStr: string) {
    const userBalance = await getUserBalance(from.id);

    let amount: number;
    if (amountStr === "all") {
        amount = userBalance;
    } else {
        amount = Number.parseInt(amountStr, 10);
    }

    if (Number.isNaN(amount)) {
        return errorEmbed().setDescription("Invalid amount argument!");
    }

    if (from.id === to.id) {
        return errorEmbed().setTitle("Haha, no.");
    }

    const embed = angryCoinEmbed().setTitle("Pay");

    if (amount < 0) {
        return embed.setDescription("You can't give someone debt sadly :(");
    }

    if (userBalance < amount) {
        return embed.setDescription("You don't have enough angry coins to pay that amount.");
    }

    if (amount === 0) {
        // can get someone into debt :) but if alaredy in debt, the command won't run again.
        const expenses = getRandomInt(1, 10);
        await updateUserBalance({ userId: from.id, amount: -expenses, username: from.username });
        await updateUserBalance({ userId: clientId, amount: expenses });
        return embed.setDescription(
            `You paid **${amount}** angry coins to ${to.username} and paid **${expenses}** coins transactions fees.`,
        );
    }

    const fees = Math.floor(amount * 0.05);
    amount = amount - fees;
    await updateUserBalance({ userId: from.id, amount: -amount, username: from.username });
    await updateUserBalance({ userId: to.id, amount, username: to.username });
    if (fees > 0) {
        await updateUserBalance({ userId: clientId, amount: fees });
    }

    return embed.setDescription(
        `You paid **${amount}** angry coins to ${to.username} and paid **${fees}** coins transactions fees.`,
    );
}
