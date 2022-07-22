import { Client, Intents, Collection } from 'discord.js';
import dotenv from 'dotenv';
import {
    IMessageCommand,
    ISlashCommand,
    Bibleverse,
    Catgirl,
    Luhans,
    Tarot,
    Yesno,
    About,
    Birthday,
    Censored,
    Censorship as CensorshipCommand,
    Emojicount,
} from './commands';
import { MessageUtils, init, DateUtils, Log } from '@helpers';
import { prefix, version } from '@data';
import { Censorship, Tarotreminder, Emojicounter, Reactor, FeetHandler, MediaHandler } from './plugins';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

let log: Log | undefined;

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    ],
});

const messageCommands = new Collection<string, IMessageCommand>();
const interactionCommands = new Collection<string, ISlashCommand>();

// Set message commands
messageCommands.set(About.name, About.executeMessage);
messageCommands.set(Birthday.name, Birthday.executeMessage);
messageCommands.set(Censored.name, Censored.executeMessage);
messageCommands.set(CensorshipCommand.name, CensorshipCommand.executeMessage);
messageCommands.set(Emojicount.name, Emojicount.executeMessage);

messageCommands.set(Bibleverse.name, Bibleverse.executeMessage);
messageCommands.set(Catgirl.name, Catgirl.executeMessage);
messageCommands.set(Luhans.name, Luhans.executeMessage);
messageCommands.set(Tarot.name, Tarot.executeMessage);
messageCommands.set(Yesno.name, Yesno.executeMessage);

// Set interaction commands
interactionCommands.set(Bibleverse.name, Bibleverse.executeInteraction);
interactionCommands.set(Catgirl.name, Catgirl.executeInteraction);
interactionCommands.set(Luhans.name, Luhans.executeInteraction);
interactionCommands.set(Tarot.name, Tarot.executeInteraction);
interactionCommands.set(Yesno.name, Yesno.executeInteraction);

client.on('ready', async () => {
    console.log('Bot is logged in and ready!');
    await init();
    log = new Log('AngryBot');

    log.info(`Started bot version ${version}`, 'angry-bot.ts');

    // Set Tarotreminder to run every day at 19:00
    const tarotReminder = DateUtils.getNextTime(19);
    setTimeout(() => {
        setInterval(() => {
            Tarotreminder.remind(client);
        }, 24 * 60 * 60 * 1000);

        Tarotreminder.remind(client);
    }, tarotReminder.getTime() - Date.now());
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (!interactionCommands.has(interaction.commandName)) {
        return console.error(`Command ${interaction.commandName} not found.`);
    }

    try {
        await interactionCommands.get(interaction.commandName)?.(interaction);
    } catch (error) {
        log?.error(error, 'interactionCreate');
        return interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.on('messageCreate', async message => {
    if (message.author.id === client.user?.id) return;

    if (await FeetHandler.handleFeetChannelMessage(message)) {
        return;
    }

    if (MessageUtils.startsWith(message, prefix)) {
        const args = message.cleanContent.slice(prefix.length).trim().split(/ +/);
        const command = args.shift()?.toLowerCase() ?? 'about';

        if (messageCommands.has(command)) {
            try {
                messageCommands.get(command)?.(message, args);
            } catch (error) {
                await message.reply('An error occured 🥴');
            }
        } else {
            await message.reply(`That is not a command i know of 🥴`);
        }
        return;
    }

    if (await Censorship.censor(message)) {
        return;
    }

    await Emojicounter.count(message);
    await MediaHandler.react(message);
    await Reactor.react(message);
});

client.on('messageReactionAdd', async (messageReaction, user) => {
    if (user.id === client.user?.id) return;

    await FeetHandler.handleReaction(messageReaction, user);
});

client.login(process.env.ANGRY1_TOKEN).catch(e => console.error(e));
