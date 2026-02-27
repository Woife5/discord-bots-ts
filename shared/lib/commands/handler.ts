import { type CacheType, type Collection, type Interaction, MessageFlags } from "discord.js";
import type { CommandHandler } from "./types";

export function getCommandHandler(commands: Collection<string, CommandHandler>) {
    return async (interaction: Interaction<CacheType>) => {
        if (!interaction.isChatInputCommand()) {
            return;
        }

        if (!commands.has(interaction.commandName)) {
            console.error(`Command ${interaction.commandName} not found.`);
            return;
        }

        try {
            await commands.get(interaction.commandName)?.executeInteraction(interaction);
        } catch (error) {
            console.error("In interactionCreate:", error);
            interaction.reply({
                content: "There was an error while executing this command!",
                flags: MessageFlags.Ephemeral,
            });
        }
    };
}
