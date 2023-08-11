/* eslint-disable no-console */
import { Client, Collection, GatewayIntentBits } from "discord.js";
import { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { registerApplicationCommands } from "@woife5/shared/lib/plugins/register-commands";
import { clientId, token } from "@woife5/shared/lib/utils/env.util";
import * as Commands from "./commands/command-handlers";

// immediately exit if a kill command is received
process.on("SIGTERM", () => {
    process.exit(0);
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

const commands = new Collection<string, CommandHandler>();

// Set commands
Object.values(Commands).forEach(command => {
    commands.set(command.data.name, command);
});

client.on("ready", async () => {
    console.log("Bot is logged in and ready!");

    // Re-register all slash commands when the bot starts
    registerApplicationCommands(token, clientId, commands);
});

client.on("interactionCreate", async interaction => {
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
        console.error(error);
        interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
        return;
    }
});

client.login(token).catch(e => console.error(e));
