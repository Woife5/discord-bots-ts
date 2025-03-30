import type { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { type ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

export const help: CommandHandler = {
    data: new SlashCommandBuilder().setName("help").setDescription("Get help with Microsoft Copilot."),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        await interaction.reply({ embeds: [runCommand()] });
    },
};

function runCommand() {
    return new EmbedBuilder()
        .setColor("DarkVividPink")
        .setAuthor({ name: "BollerBot", iconURL: "https://radiobollerwagen.de/wp-content/uploads/2023/05/ffn_Logo_Radio_Bollerwagen_rgb-kleiner.png", url: "https://radiobollerwagen.de/" })
        .setDescription("Happy Birthday Felx :D");
}
