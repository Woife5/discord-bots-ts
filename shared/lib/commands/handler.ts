import { type CacheType, type Collection, type Interaction, MessageFlags } from "discord.js";
import type { CommandHandler } from "./types";

const ERROR_MESSAGE = "There was an error while executing this command!";

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

            try {
                if (interaction.replied) {
                    await interaction.followUp({ content: ERROR_MESSAGE, flags: MessageFlags.Ephemeral });
                } else if (interaction.deferred) {
                    await interaction.editReply({ content: ERROR_MESSAGE });
                } else {
                    await interaction.reply({ content: ERROR_MESSAGE, flags: MessageFlags.Ephemeral });
                }
            } catch (reportingError) {
                console.error("Failed to report command error to the user:", reportingError);
            }
        }
    };
}
