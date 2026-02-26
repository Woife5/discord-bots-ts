import type { CommandHandler } from "@woife5/shared";
import {
    type APIEmbedField,
    type ChatInputCommandInteraction,
    type Guild,
    SlashCommandBuilder,
    type User,
} from "discord.js";
import * as Commands from "../command-handlers";
import { infoEmbed } from "../embeds";

export const help: CommandHandler = {
    data: new SlashCommandBuilder().setName("help").setDescription("Get a list of commands and a short explanation."),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        await interaction.reply({ embeds: [await runCommand(interaction.user, interaction.guild)] });
    },
};

async function runCommand(user: User, guild: Guild | null) {
    if (!guild) {
        return infoEmbed().setDescription("This command can only be used in a server.");
    }

    const isAdmin = guild?.members.cache.get(user.id)?.permissions.has("Administrator") ?? false;

    const showCommand = (command: CommandHandler) => isAdmin || command.data.default_member_permissions === "8";
    return infoEmbed()
        .setTitle("Available Commands")
        .addFields(
            Object.values(Commands)
                .filter(showCommand)
                .map((command) => {
                    return {
                        name: command.data.name,
                        value: command.data.description,
                    } satisfies APIEmbedField;
                }),
        );
}
