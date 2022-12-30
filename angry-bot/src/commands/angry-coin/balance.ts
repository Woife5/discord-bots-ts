import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction, EmbedBuilder, User } from "discord.js";
import { getUserBalance } from "helpers/user.util";
import { CommandHandler } from "shared/lib/commands/types.d";

export const balance: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("Check your current angry coin balance.")
        .addUserOption(option => option.setName("user").setDescription("The user to check the balance of.")),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const user = interaction.options.getUser("user") ?? interaction.user;
        interaction.reply({ embeds: [await runCommand(user)], ephemeral: true });
    },
};

async function runCommand(user: User) {
    const userBalance = await getUserBalance(user.id);

    return new EmbedBuilder()
        .setColor("Yellow")
        .setTitle("Current Balance")
        .setDescription(`${user.username}'s current balance is: **${userBalance}** angry coins.`);
}
