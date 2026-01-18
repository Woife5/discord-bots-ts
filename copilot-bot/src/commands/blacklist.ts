import type { CommandHandler } from "@woife5/shared/lib/commands/types";
import { type ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { blacklistModel, getBlacklistedModels } from "llm-connector/openrouter";
import { adminEmbed } from "./embed";

export const blacklist: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("blacklist")
        .setDescription("Edit the model blacklist.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption((option) =>
            option.setName("model_id").setDescription("The ID of the model to blacklist.").setRequired(true),
        ),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        await interaction.deferReply();
        const modelId = interaction.options.getString("model_id", true);
        blacklistModel(modelId);

        const blacklistedModels = getBlacklistedModels();

        const embed = adminEmbed().setDescription(
            `Model \`${modelId}\` has been blacklisted. \n\n**Current Blacklisted Models (${blacklistedModels.length}):**\n` +
                blacklistedModels.map((model) => `- \`${model}\``).join("\n"),
        );

        interaction.editReply({ embeds: [embed] });
    },
};
