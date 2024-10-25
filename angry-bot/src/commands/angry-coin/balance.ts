import type { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { angryCoinEmbed } from "commands/embeds";
import { type ChatInputCommandInteraction, SlashCommandBuilder, type User } from "discord.js";
import { getUserBalance } from "helpers/user.util";

export const balance: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("Check your current angry coin balance.")
        .addUserOption((option) => option.setName("user").setDescription("The user to check the balance of.")),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const user = interaction.options.getUser("user") ?? interaction.user;
        interaction.reply({ embeds: [await runCommand(user)], ephemeral: true });
    },
};

async function runCommand(user: User) {
    const userBalance = await getUserBalance(user.id);

    return angryCoinEmbed()
        .setTitle("Current Balance")
        .setDescription(`${user.username}'s current balance is: **${userBalance}** angry coins.`);
}
