/* eslint-disable no-console */
import { ChatInputCommandInteraction, Client, Collection, Message } from "discord.js";
import dotenv from "dotenv";
import { init, Log } from "@helpers";
import { prefix, version } from "@data";
import { Censorship, Tarotreminder, Emojicounter, Reactor, FeetHandler, MediaHandler, Taxation } from "./plugins";
import * as Commands from "./commands";
import { registerApplicationCommands } from "plugins/register-commands";
import { GatewayIntentBits } from "discord-api-types/v10";
import { getUserRole } from "helpers/user.util";
import { getNextTime } from "shared/lib/utils/date.util";
import { startsWith } from "shared/lib/utils/message.util";
import { MessageWrapper, PluginReturnCode } from "shared/lib/messages/message-wrapper";
import { CommandHandler } from "shared/lib/commands/types.d";

if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}

let log: Log | undefined;

const clientId = process.env.CLIENT_ID;
const token = process.env.ANGRY1_TOKEN;
const adminId = process.env.WOLFGANG_ID;

if (!token || !clientId || !adminId) {
    console.error("No token or client id provided!");
    process.exit(1);
}

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

// Set message commands
Object.values(Commands).forEach(command => {
    commands.set(command.data.name, command);
});

client.on("ready", async () => {
    console.log("Bot is logged in and ready!");
    await init();
    log = new Log("AngryBot");

    log.info(`Started bot version ${version}`, "angry-bot.ts");

    // Set Tarotreminder to run every day at 19:00
    setTimeout(() => {
        setInterval(() => {
            Tarotreminder.remind(client);
        }, 24 * 60 * 60 * 1000);

        Tarotreminder.remind(client);
    }, getNextTime(19).getTime() - Date.now());

    // Check every day at some time if a given user has spent some coins today, otherwise tax them
    setTimeout(() => {
        setInterval(() => {
            Taxation.tax(client);
        }, 24 * 60 * 60 * 1000);

        Taxation.tax(client);
    }, getNextTime(19).getTime() - Date.now());

    // Re-register all slash commands when the bot starts
    registerApplicationCommands(token, clientId, commands);
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand()) {
        return;
    }

    if (!commands.has(interaction.commandName)) {
        console.error(`Command ${interaction.commandName} not found.`);
        return;
    }

    try {
        await commands.get(interaction.commandName)?.executeInteraction(interaction as ChatInputCommandInteraction);
    } catch (error) {
        log?.error(error, "interactionCreate");
        interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
        return;
    }
});

const handleCommands = async (message: Message): Promise<PluginReturnCode> => {
    if (!startsWith(message, prefix)) {
        return "CONTINUE";
    }

    message.reply(
        "Using message commands will be disabled soon. Discord does not like bots using message commands. Please use slash commands instead."
    );

    const args = message.cleanContent.slice(prefix.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase() || "help";

    if (!commands.has(command)) {
        await message.reply("That is not a command i know of 🥴");
        return "ABORT";
    }

    try {
        const commandRef = commands.get(command);
        if (!commandRef || !message.guild) {
            throw new Error();
        }
        const userRole = await getUserRole(message.author, message.guild);
        if (commandRef.role && userRole < commandRef.role) {
            await message.reply("You don't have the required role to use this command! 🥴");
        } else {
            await commandRef.executeMessage(message, args);
        }
    } catch (error) {
        await message.reply("An error occured 🥴");
    }

    return "ABORT";
};

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
    await msg.applyPlugin(handleCommands);
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
