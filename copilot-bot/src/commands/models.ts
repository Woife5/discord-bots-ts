import type { CommandHandler } from "@woife5/shared/lib/commands/types";
import { type ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getBlacklistedModels, getFreeModels } from "llm-connector/openrouter";
import { adminEmbed } from "./embed";

export const models: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("models")
        .setDescription("Get all the currently active models in the cache.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        await interaction.deferReply();

        const models = await getFreeModels();

        const modelsText = models.map((model) => `- \`${model}\``).join("\n") || "No free models available";
        const blacklistedText =
            getBlacklistedModels()
                .map((model) => `- \`${model}\``)
                .join("\n") || "No blacklisted models";

        const embed = adminEmbed().setDescription(
            `**Active Free Models (${models.length}):**\n${modelsText}\n\n**Blacklisted Models (${getBlacklistedModels().length}):**\n${blacklistedText}`,
        );

        interaction.editReply({ embeds: [embed] });
    },
};
