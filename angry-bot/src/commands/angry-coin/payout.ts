import { SlashCommandBuilder } from "@discordjs/builders";
import { angryCoinEmbed } from "commands/embeds";
import { ChatInputCommandInteraction, PermissionFlagsBits, User as DiscordUser } from "discord.js";
import { adminId, clientId } from "@woife5/shared/lib/utils/env.util";
import { getUserBalance, updateUserBalance } from "helpers/user.util";
import { CommandHandler } from "@woife5/shared/lib/commands/types.d";

export const payout: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("payout")
        .setDescription("Distribute the earned angry coins to the users.")
        .addStringOption(option =>
            option.setName("amount").setDescription("The amount of coins to distribute or `all`.").setRequired(true)
        )
        .addUserOption(option => option.setName("user").setDescription("The user to distribute the coins to."))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const amountStr = interaction.options.getString("amount") ?? "";
        const amount = parseInt(amountStr, 10);
        const all = amountStr === "all";
        const user = interaction.options.getUser("user");

        if (interaction.user.id !== adminId) {
            interaction.reply({ content: "You don't have permission to do this!", ephemeral: true });
            return;
        }

        interaction.reply({ embeds: [await runCommand(user ?? interaction.user, amount, all)] });
    },
};

async function runCommand(user: DiscordUser, amount: number, all: boolean) {
    const botBalance = await getUserBalance(clientId);

    if (all) {
        amount = botBalance;
    }

    const embed = angryCoinEmbed()
        .setTitle("Payout")
        .setDescription(`The amount of ${amount} coins has been payed to ${user}`);

    if (isNaN(amount) || amount <= 0 || amount > botBalance) {
        return embed.setDescription(
            "The selected amount is not valid, please select a valid, positive integer or `all`."
        );
    }

    await updateBalance(user, amount);

    return embed;
}

async function updateBalance(discordUser: DiscordUser, amount: number) {
    await updateUserBalance({ userId: clientId, amount: -amount, username: "Angry" });
    await updateUserBalance({ userId: discordUser.id, amount, username: discordUser.username });
}
