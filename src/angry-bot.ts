import { Client, Intents, Collection, Message } from 'discord.js';
import dotenv from 'dotenv';
import { IMessageCommand, ISlashCommand } from './commands/command-interfaces';
import * as AngryCommands from './commands/angry';
import { MessageUtils } from './helpers';
import { DatabaseUtils } from './helpers';
import { prefix } from './data';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
});

const messageCommands: Collection<string, IMessageCommand> = new Collection();
const slashCommands: Collection<string, ISlashCommand> = new Collection();

Object.values(AngryCommands).forEach(command => {
    messageCommands.set(command.name, command.executeMessage);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (!slashCommands.has(interaction.commandName)) {
        return console.error(`Command ${interaction.commandName} not found.`);
    }

    try {
        await slashCommands.get(interaction.commandName)!(interaction);
    } catch (error) {
        console.error(error);
        return interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.on('ready', () => {
    console.log('Bot is logged in and ready!');
    DatabaseUtils.init();
});

client.on('messageCreate', async message => {
    // This version of the bot listens on messages for commands
    if (MessageUtils.startsWith(message, prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift()?.toLowerCase() ?? 'about';

        if (messageCommands.has(command)) {
            try {
                const commandFn = messageCommands.get(command)!;

                commandFn(message, args);
            } catch (error) {
                message.reply('An error occured 🥴');
            }
            return;
        } else {
            message.reply(`That is not a command i know of 🥴`);
        }
        return;
    }
});

client.login(process.env.DISCORD_TOKEN);
