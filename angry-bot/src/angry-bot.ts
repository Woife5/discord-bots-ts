/* eslint-disable no-console */
import { version } from "@data";
import { init, Log } from "@helpers";
import { GatewayIntentBits } from "discord-api-types/v10";
import { Client, Collection, Message } from "discord.js";
import { clientId, token } from "@woife5/shared/lib/utils/env.util";
import { schedule } from "node-cron";
import { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { MessageWrapper, PluginReturnCode } from "@woife5/shared/lib/messages/message-wrapper";
import { registerApplicationCommands } from "@woife5/shared/lib/plugins/register-commands";
import * as Commands from "./commands/command-handlers";
import { Censorship, Emojicounter, FeetHandler, MediaHandler, Reactor, Tarotreminder, Taxation } from "./plugins";

let log: Log | undefined;

// immediately exit if a kill command is received
process.on("SIGTERM", () => {
    process.exit(0);
});

// Handle all uncaught exceptions
process.on("uncaughtException", err => {
    log?.error(err, "uncaughtException");
    console.error(err);
    process.exit(1);
});

process.on("unhandledRejection", err => {
    log?.error(err, "unhandledRejection");
    console.error(err);
    process.exit(1);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
    ],
});

const commands = new Collection<string, CommandHandler>();

// Set commands
Object.values(Commands).forEach(command => {
    commands.set(command.data.name, command);
});

client.on("ready", async () => {
    console.log("Bot is logged in and ready!");
    await init();
    log = new Log("AngryBot");

    log.info(`Started bot version ${version}`, "angry-bot.ts");

    // Set Tarotreminder to run every day at 19:00
    schedule(
        "0 19 * * *",
        () => {
            Tarotreminder.remind(client);
        },
        { timezone: "Europe/Vienna" },
    );

    // Check every day at some time if a given user has spent some coins today, otherwise tax them
    schedule(
        "0 19 * * *",
        async () => {
            const result = await Taxation.tax();
            Taxation.broadcast(client, result.taxMoney, result.taxedUsers);
        },
        { timezone: "Europe/Vienna" },
    );

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
        log?.error(error, "interactionCreate");
        interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
        return;
    }
});

const isApplicable = async (message: Message): Promise<PluginReturnCode> => {
    if (message.author.id === client.user?.id || message.author.bot) {
        return "ABORT";
    }
    return "CONTINUE";
};

client.on("messageCreate", async message => {
    const msg = new MessageWrapper(message);
    await msg.applyPlugin(isApplicable);

    await msg.applyPlugin(FeetHandler.handleFeetChannelMessage);
    await msg.applyPlugin(Censorship.censor);
    await msg.applyPlugin(Emojicounter.count);
    await msg.applyPlugin(MediaHandler.react);
    await msg.applyPlugin(Reactor.react);
});

client.on("messageUpdate", async (oldMsg, newMsg) => {
    if (oldMsg.content === newMsg.content) {
        return;
    }

    await Censorship.censor(newMsg);
});

client.on("messageReactionAdd", async (messageReaction, user) => {
    if (user.id === client.user?.id) {
        return;
    }

    await FeetHandler.handleReaction(messageReaction, user);
});

client.login(token).catch(e => console.error(e));
