import type { CommandHandler } from "@woife5/shared";
import {
    type ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SeparatorBuilder,
    SeparatorSpacingSize,
    SlashCommandBuilder,
    TextDisplayBuilder,
} from "discord.js";
import { getSystemMessage, setSystemMessage } from "llm-connector/chat-history";

export const systemMessage: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("systemmessage")
        .setDescription("Edit the system message.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption((option) => option.setName("message").setDescription("The new system message.")),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const newMessage = interaction.options.getString("message");

        const separator = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large);

        if (!newMessage) {
            const header = new TextDisplayBuilder().setContent("Current system message:");
            const text = new TextDisplayBuilder().setContent(getSystemMessage());
            interaction.reply({
                components: [header, separator, text],
                flags: MessageFlags.IsComponentsV2,
            });
            return;
        }

        setSystemMessage(newMessage);
        const header = new TextDisplayBuilder().setContent("System message updated to:");
        const newText = new TextDisplayBuilder().setContent(newMessage);
        interaction.reply({ components: [header, separator, newText], flags: MessageFlags.IsComponentsV2 });
    },
};
