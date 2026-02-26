import type { CommandHandler } from "@woife5/shared";
import { type ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { clearHistory, getHistory } from "llm-connector/chat-history";
import { adminEmbed } from "./embed";

export const history: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("history")
        .setDescription("Edit the chat history.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption((option) =>
            option
                .setName("command")
                .setDescription("The command to execute on the chat history.")
                .setRequired(true)
                .addChoices({ name: "clear", value: "clear" }, { name: "length", value: "length" }),
        ),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const command = interaction.options.getString("command", true);

        switch (command) {
            case "length": {
                const embedLength = adminEmbed().setDescription(
                    `Current chat history length: \`${getHistory().length}\``,
                );
                interaction.reply({ embeds: [embedLength] });
                return;
            }
            case "clear": {
                clearHistory();
                const embed = adminEmbed().setDescription(`Chat history has been cleared.`);
                interaction.reply({ embeds: [embed] });
                return;
            }
        }
    },
};
