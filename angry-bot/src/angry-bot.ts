/* eslint-disable no-console */
import { Client, Intents, Collection, Message } from "discord.js";
import dotenv from "dotenv";
import { MessageUtils, init, DateUtils, Log, MessageWrapper, PluginReturnCode, getUserRole } from "@helpers";
import { prefix, version } from "@data";
import { Censorship, Tarotreminder, Emojicounter, Reactor, FeetHandler, MediaHandler } from "./plugins";
import * as Commands from "./commands";
import { ICommand } from "commands/command-interfaces";
import { registerApplicationCommands } from "plugins/register-commands";

if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}

let log: Log | undefined;

const clientId = process.env.CLIENT_ID;
const token = process.env.ANGRY1_TOKEN;

if (!token || !clientId) {
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
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    ],
});

const messageCommands = new Collection<string, ICommand>();
const interactionCommands = new Collection<string, ICommand>();

// Set message commands
Object.values(Commands).forEach(command => {
    messageCommands.set(command.data.name, command);
});

// Set interaction commands
interactionCommands.set(Commands.about.data.name, Commands.about);
interactionCommands.set(Commands.help.data.name, Commands.help);
interactionCommands.set(Commands.bibleverse.data.name, Commands.bibleverse);
interactionCommands.set(Commands.catgirl.data.name, Commands.catgirl);
interactionCommands.set(Commands.catboy.data.name, Commands.catboy);
interactionCommands.set(Commands.luhans.data.name, Commands.luhans);
interactionCommands.set(Commands.tarot.data.name, Commands.tarot);
interactionCommands.set(Commands.yesno.data.name, Commands.yesno);

client.on("ready", async () => {
    console.log("Bot is logged in and ready!");
    await init();
    log = new Log("AngryBot");

    log.info(`Started bot version ${version}`, "angry-bot.ts");

    // Set Tarotreminder to run every day at 19:00
    const tarotReminder = DateUtils.getNextTime(19);
    setTimeout(() => {
        setInterval(() => {
            Tarotreminder.remind(client);
        }, 24 * 60 * 60 * 1000);

        Tarotreminder.remind(client);
    }, tarotReminder.getTime() - Date.now());

    // Re-register all slash commands when the bot starts
    registerApplicationCommands(token, clientId, interactionCommands);
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand()) {
        return;
    }

    if (!interactionCommands.has(interaction.commandName)) {
        return console.error(`Command ${interaction.commandName} not found.`);
    }

    try {
        await interactionCommands.get(interaction.commandName)?.executeInteraction(interaction);
    } catch (error) {
        log?.error(error, "interactionCreate");
        return interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
    }
});

const handleCommands = async (message: Message): Promise<PluginReturnCode> => {
    if (MessageUtils.startsWith(message, prefix)) {
        const args = message.cleanContent.slice(prefix.length).trim().split(/ +/);
        const command = args.shift()?.toLowerCase() || "help";

        if (messageCommands.has(command)) {
            try {
                const commandRef = messageCommands.get(command);
                if (!commandRef || !message.guild) {
                    throw new Error();
                }

                const userRole = await getUserRole(message.author, message.guild);
                if (commandRef.role && userRole < commandRef.role) {
                    await message.reply("You don't have the required role to use this command! 🥴");
                    return "ABORT";
                }

                await commandRef.executeMessage(message, args);
            } catch (error) {
                await message.reply("An error occured 🥴");
            }
        } else {
            await message.reply("That is not a command i know of 🥴");
        }
        return "ABORT";
    }

    return "CONTINUE";
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

client.on("messageReactionAdd", async (messageReaction, user) => {
    if (user.id === client.user?.id) {
        return;
    }

    await FeetHandler.handleReaction(messageReaction, user);
});

client.login(token).catch(e => console.error(e));
