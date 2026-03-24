import type { CommandHandler } from "@woife5/shared";
import { type ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { COPILOT_ICON, MESSAGE } from "../consants";

export const help: CommandHandler = {
    data: new SlashCommandBuilder().setName("help").setDescription("Get help with Microsoft Copilot."),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        await interaction.reply({ embeds: [runCommand()] });
    },
};

function runCommand() {
    return new EmbedBuilder()
        .setColor("White")
        .setAuthor({ name: "Copilot", iconURL: COPILOT_ICON })
        .setTitle("Microsoft Copilot")
        .setDescription(MESSAGE);
}
