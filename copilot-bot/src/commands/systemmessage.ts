import type { CommandHandler } from "@woife5/shared/lib/commands/types";
import { type ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getSystemMessage, setSystemMessage } from "llm-connector/chat-history";
import { adminEmbed } from "./embed";

export const systemMessage: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("systemmessage")
        .setDescription("Edit the system message.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption((option) => option.setName("message").setDescription("The new system message.")),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const newMessage = interaction.options.getString("message");

        if (!newMessage) {
            interaction.reply({
                embeds: [adminEmbed().setDescription(`Current system message:\n\`${getSystemMessage()}\``)],
            });
            return;
        }

        setSystemMessage(newMessage);
        const embed = adminEmbed().setDescription(`System message updated to:\n\`${newMessage}\``);
        interaction.reply({ embeds: [embed] });
    },
};
