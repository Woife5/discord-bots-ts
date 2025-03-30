import type { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { bollerTarget } from "database/boller-target";
import { type ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, type User } from "discord.js";

export const target: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("target")
        .setDescription("Set a target user. If no user is provided, the first user per guild will be joined after.")
        .addUserOption((option) => option.setName("user").setDescription("The user to set as target")),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const user = interaction.options.getUser("user");

        await interaction.reply({ embeds: [runCommand(user)] });
    },
};

const embed = () => new EmbedBuilder().setColor("DarkVividPink").setAuthor({ name: "BollerBot" });

function runCommand(user: User | null) {
    if (!user) {
        bollerTarget.id = null;
        bollerTarget.name = null;
        return embed().setDescription(
            "Target has been reset. The first user per server will be joined after and bollered! :D After the last user leaves, the bot will also leave the channel.",
        );
    }

    bollerTarget.id = user.id;
    bollerTarget.name = user.username;
    return embed().setDescription(
        `Set the target user to ${user.username}. Will join each voice channel the user switches to and only leave after all users leave.`,
    );
}
