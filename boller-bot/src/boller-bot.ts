import { type CommandHandler, registerApplicationCommands } from "@woife5/shared";
import { clientId, token } from "helpers/env.util";
import { Client, Collection, GatewayIntentBits, MessageFlags } from "discord.js";
import { handleVoiceStateUpdate } from "player";
import * as Commands from "./commands/command-handlers";

// immediately exit if a kill command is received
process.on("SIGTERM", () => {
    process.exit(0);
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

const commands = new Collection<string, CommandHandler>();

// Set commands
for (const command of Object.values(Commands)) {
    commands.set(command.data.name, command);
}

client.on("clientReady", async () => {
    console.log("BollerBot is logged in and ready to boller!");

    // Re-register all slash commands when the bot starts
    registerApplicationCommands(token, clientId, commands);
});

client.on("interactionCreate", async (interaction) => {
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
        interaction.reply({
            content: "There was an error while executing this command!",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }
});

client.on("voiceStateUpdate", (oldState, newState) => {
    if (newState.member?.user.bot) {
        // Ignore if the user is a bot
        return;
    }

    if (oldState.channelId === newState.channelId) {
        // Ignore if the channel did not change
        return;
    }

    handleVoiceStateUpdate(oldState, newState);
});

client.login(token).catch((e) => console.error(e));
