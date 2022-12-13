import { Message, EmbedBuilder, User, ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { angryIconCDN, repoURL } from "@data";
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
    executeMessage: async (message: Message): Promise<void> => {
        const user = message.mentions.users.first() ?? message.author;

        message.reply({ embeds: [await runCommand(user)] });
    },
};

async function runCommand(user: User) {
    const userBalance = await getUserBalance(user.id);

    return new EmbedBuilder()
        .setColor("Yellow")
        .addFields({
            name: "Current Balance",
            value: `${user.username}'s current balance is: **${userBalance}** angry coins.`,
        })
        .setAuthor({
            name: "Angry",
            iconURL: angryIconCDN,
            url: repoURL,
        });
}
