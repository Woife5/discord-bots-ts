import { type CommandHandler, getCommandHandler, registerApplicationCommands } from "@woife5/shared";
import {
    Client,
    Collection,
    GatewayIntentBits,
    type Message,
    type OmitPartialGroupDMChannel,
    Partials,
} from "discord.js";
import { version } from "../package.json";
import * as Commands from "./commands/command-handlers";
import { clientId, token } from "./constants";
import { closeDatabase, connectToDatabase } from "./database/client";
import { addMessage, removeMessages, restoreBuffers, shutdown, updateMessage } from "./message-history";
import { startDailyScheduler, stopDailyScheduler } from "./pipelines/channel-daily";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
    ],
    // Required to receive update and delete events for messages that are not
    // in discord.js' own cache, which is the normal case for a buffer that
    // lives in MongoDB.
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const commands = new Collection<string, CommandHandler>();

// Set commands
for (const command of Object.values(Commands)) {
    commands.set(command.data.name, command);
}

client.on("clientReady", async (readyClient) => {
    console.log("Bot is logged in and ready!");
    console.log(`Started frens-bot version ${version}`);

    // Re-register all slash commands when the bot starts
    registerApplicationCommands(token, clientId, commands);

    // Inactivity timers do not survive a restart, so rebuild them.
    await restoreBuffers(readyClient).catch((error) => {
        console.error("Failed to restore buffered channels", error);
    });

    // Daily channel summaries; also catches up on runs missed while down.
    startDailyScheduler(readyClient);
});

client.on("interactionCreate", getCommandHandler(commands));

client.on("messageCreate", (message) => {
    if (!isRelevant(message)) {
        return;
    }

    void addMessage(message).catch((error) => {
        console.error(`Failed to record message from channel ${message.channelId}`, error);
    });
});

client.on("messageUpdate", (_oldMessage, newMessage) => {
    void (async () => {
        try {
            // Partials carry little more than ids, so resolve the full message.
            const message = newMessage.partial ? await newMessage.fetch() : newMessage;
            if (!isRelevant(message)) {
                return;
            }

            await updateMessage(message);
        } catch (error) {
            console.error(`Failed to apply update for message ${newMessage.id}`, error);
        }
    })();
});

client.on("messageDelete", (message) => {
    void removeMessages([message.id]).catch((error) => {
        console.error(`Failed to tombstone message ${message.id}`, error);
    });
});

client.on("messageDeleteBulk", (messages) => {
    void removeMessages([...messages.keys()]).catch((error) => {
        console.error("Failed to tombstone bulk deleted messages", error);
    });
});

function isRelevant(message: Message): message is OmitPartialGroupDMChannel<Message<true>> {
    return !message.author.bot && message.inGuild();
}

let shuttingDown = false;

async function gracefulShutdown(signal: string) {
    if (shuttingDown) {
        return;
    }
    shuttingDown = true;

    console.log(`Received ${signal}, shutting down`);

    try {
        // Buffered messages stay in MongoDB and are restored on the next boot.
        stopDailyScheduler();
        await shutdown();
        await client.destroy();
        await closeDatabase();
    } catch (error) {
        console.error("Error during shutdown", error);
    }

    process.exit(0);
}

process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => void gracefulShutdown("SIGINT"));

(async () => {
    try {
        await connectToDatabase();
        await client.login(token);
    } catch (e) {
        console.error(e);
    }
})();
