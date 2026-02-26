import { type CommandHandler, registerApplicationCommands } from "@woife5/shared";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import * as Commands from "./commands/command-handlers";

const { CLIENT_ID, BOT_TOKEN } = process.env;

if (!CLIENT_ID || !BOT_TOKEN) {
    console.error("Please provide all of the following environment variables: CLIENT_ID, BOT_TOKEN");
    process.exit(1);
}

// immediately exit if a kill command is received
process.on("SIGTERM", () => {
    process.exit(0);
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

const commands = new Collection<string, CommandHandler>();

// Set commands
for (const command of Object.values(Commands)) {
    commands.set(command.data.name, command);
}

client.on("clientReady", async () => {
    console.log("Bot is logged in and ready!");

    // Re-register all slash commands when the bot starts
    registerApplicationCommands(BOT_TOKEN, CLIENT_ID, commands);
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
        interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
        return;
    }
});

client.login(BOT_TOKEN).catch((e) => console.error(e));
