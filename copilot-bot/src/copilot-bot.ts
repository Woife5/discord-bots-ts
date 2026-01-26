import type { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { registerApplicationCommands } from "@woife5/shared/lib/plugins/register-commands";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import { appendToHistory, getHistory } from "llm-connector/chat-history";
import { getChatCompletion } from "llm-connector/openrouter";
import { splitAndSendAsComponents } from "llm-connector/split-send";
import * as Commands from "./commands/command-handlers";
import { clientId, MESSAGE, token } from "./consants";

// immediately exit if a kill command is received
process.on("SIGTERM", () => {
    process.exit(0);
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const commands = new Collection<string, CommandHandler>();

// Set commands
for (const command of Object.values(Commands)) {
    commands.set(command.data.name, command);
}

client.on("clientReady", async () => {
    console.log("Bot is logged in and ready!");

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
        interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
        return;
    }
});

client.on("messageCreate", async (message) => {
    if (!client.user) return;

    if (!message.mentions.has(client.user)) return;

    message.channel.sendTyping();
    const typingInterval = setInterval(() => {
        message.channel.sendTyping();
    }, 9_500);

    const cleanMessage = message.cleanContent
        .replace(/<@!?(\d+)>/g, "")
        .trim()
        .replaceAll("@Copilot ", "");

    try {
        const reply = await getChatCompletion(getHistory(cleanMessage));
        if (reply) {
            appendToHistory("assistant", reply);
            splitAndSendAsComponents(reply, message.channel);
            return;
        }
    } catch (_ignored) {
    } finally {
        clearInterval(typingInterval);
    }

    // @copilot was mentioned
    message.channel.send(MESSAGE);
});

client.login(token).catch((e) => console.error(e));
