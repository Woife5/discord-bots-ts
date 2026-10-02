import { version } from "@data";
import { init } from "@helpers";
import {
    type CommandHandler,
    getCommandHandler,
    MessageWrapper,
    type PluginReturnCode,
    registerApplicationCommands,
} from "@woife5/shared";
import { Client, Collection, GatewayIntentBits, type Message } from "discord.js";
import { schedule } from "node-cron";
import { autocomplete as spamAutocomplete } from "./commands/administration/spam";
import * as Commands from "./commands/command-handlers";
import { clientId, token } from "./helpers/env.util";
import {
    AdRewarder,
    Censorship,
    Emojicounter,
    FeetHandler,
    MediaHandler,
    Reactor,
    Spam,
    StreakFreeze,
    Tarotreminder,
    Taxation,
} from "./plugins";

// immediately exit if a kill command is received
process.on("SIGTERM", () => {
    process.exit(0);
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
for (const command of Object.values(Commands)) {
    commands.set(command.data.name, command);
}

client.on("clientReady", async () => {
    console.log("Bot is logged in and ready!");
    await init();

    console.log(`Started angry-bot version ${version}`);

    // Set Tarotreminder to run every day at 19:00
    schedule(
        "0 19 * * *",
        () => {
            Tarotreminder.remind(client);
        },
        { timezone: "Europe/Vienna" },
    );

    // Consume tarot streak freezes for users who missed their tarot yesterday.
    // Runs every day at 00:05 (Europe/Vienna), right after the tarot day rolled over.
    schedule(
        "5 0 * * *",
        async () => {
            await StreakFreeze.applyStreakFreezes(client);
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

    // Send scheduled spams, checked every full hour
    await Spam.init(client);

    // Re-register all slash commands when the bot starts
    registerApplicationCommands(token, clientId, commands);
});

client.on("interactionCreate", getCommandHandler(commands));

// Suggest existing spam IDs while typing /spam remove (the shared command handler only handles slash commands)
client.on("interactionCreate", async (interaction) => {
    if (interaction.isAutocomplete() && interaction.commandName === Commands.spam.data.name) {
        try {
            await spamAutocomplete(interaction);
        } catch (error) {
            console.error("In autocomplete:", error);
        }
    }
});

const isApplicable = async (message: Message): Promise<PluginReturnCode> => {
    if (message.author.id === client.user?.id || message.author.bot) {
        return "ABORT";
    }
    return "CONTINUE";
};

client.on("messageCreate", async (message) => {
    const msg = new MessageWrapper(message);
    await msg.applyPlugin(isApplicable);

    await msg.applyPlugin(FeetHandler.handleFeetChannelMessage);
    await msg.applyPlugin(Censorship.censor);
    await msg.applyPlugin(Emojicounter.count);
    await msg.applyPlugin(MediaHandler.react);
    await msg.applyPlugin(Reactor.react);
    await msg.applyPlugin(AdRewarder.apply);
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

client.login(token).catch((e) => console.error(e));
