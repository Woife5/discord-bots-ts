import type { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { type ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { defaultEmbed } from "./embeds";

export const help: CommandHandler = {
    data: new SlashCommandBuilder().setName("help").setDescription("More information."),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        await interaction.reply({ embeds: [runCommand()] });
    },
};

function runCommand() {
    return defaultEmbed().setDescription("Happy Birthday Felx :D");
}
