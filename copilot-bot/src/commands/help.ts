import type { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { COPILOT_ICON, MESSAGE } from "consants";
import { type ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

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
