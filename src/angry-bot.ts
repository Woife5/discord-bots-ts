import { Client, Intents, Collection, Message, Emoji } from 'discord.js';
import dotenv from 'dotenv';
import { IMessageCommand, ISlashCommand } from './commands/command-interfaces';
import { Bibleverse, Catgirl, Luhans, Tarot, Yesno } from './commands/angrier';
import * as AngryCommands from './commands/angry';
import { MessageUtils } from './helpers';
import { init, DateUtils } from './helpers';
import { prefix } from './data';
import { Censorship, Tarotreminder, Emojicounter, Reactor, GoogleSheetsHandler } from './plugins';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
});

const messageCommands = new Collection<string, IMessageCommand>();

Object.values(AngryCommands).forEach(command => {
    messageCommands.set(command.name, command.executeMessage);
});

messageCommands.set(Bibleverse.name, Bibleverse.executeMessage);
messageCommands.set(Catgirl.name, Catgirl.executeMessage);
messageCommands.set(Luhans.name, Luhans.executeMessage);
messageCommands.set(Tarot.name, Tarot.executeMessage);
messageCommands.set(Yesno.name, Yesno.executeMessage);

client.on('ready', async () => {
    console.log('Bot is logged in and ready!');
    init();

    // Set Tarotreminder to run every day at 19:00
    const tarotReminder = DateUtils.getNextTime(19);
    setTimeout(() => {
        setInterval(() => {
            Tarotreminder.remind(client);
        }, 24 * 60 * 60 * 1000);

        Tarotreminder.remind(client);
    }, tarotReminder.getTime() - Date.now());

    // Setup google sheets handler to backup every day at midnight
    const googleSheetsHandler = DateUtils.getNextTime(0);
    setTimeout(() => {
        setInterval(() => {
            GoogleSheetsHandler.backup();
        }, 24 * 60 * 60 * 1000);

        GoogleSheetsHandler.backup();
    }, googleSheetsHandler.getTime() - Date.now());

    // Setup google sheets handler to send token reminders every 5th day at 19:00
    const wolfgang = await client.users.fetch(process.env.WOLFGANG_ID!);
    const googleSheetsHandlerToken = DateUtils.getNextTime(19);
    setTimeout(() => {
        setInterval(async () => {
            await wolfgang.send(`I will soon reqire a new google token: ${await GoogleSheetsHandler.getTokenUrl()}`);
        }, 5 * 24 * 60 * 60 * 1000);
    }, googleSheetsHandlerToken.getTime() - Date.now());
});

client.on('messageCreate', async message => {
    if (message.author.id === client.user!.id) return;

    if (message.author.id === '267281854690754561' && MessageUtils.startsWith(message, '!token')) {
        GoogleSheetsHandler.setNewToken(message.cleanContent);
    }

    // This version of the bot listens on messages for commands
    if (MessageUtils.startsWith(message, prefix)) {
        const args = message.cleanContent.slice(prefix.length).trim().split(/ +/);
        const command = args.shift()?.toLowerCase() ?? 'about';

        if (messageCommands.has(command)) {
            try {
                messageCommands.get(command)!(message, args);
            } catch (error) {
                message.reply('An error occured 🥴');
            }
            return;
        } else {
            message.reply(`That is not a command i know of 🥴`);
        }
        return;
    }

    await Censorship.censor(message);
    await Emojicounter.count(message);
    await Reactor.react(message);
});

client.login(process.env.ANGRY1_TOKEN);
