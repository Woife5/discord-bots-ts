import { Client, Intents, Collection } from 'discord.js';
import dotenv from 'dotenv';
import { ICommand } from './commands/command-interfaces';
import * as NewCommands from './commands/angrier';
import { MessageUtils } from './helpers';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const prefix = process.env.PREFIX ?? '?angry';

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
});

const commands: Collection<string, ICommand> = new Collection();

Object.entries(NewCommands).forEach(([name, command]) => {
    commands.set(name, command);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (!commands.has(interaction.commandName)) {
        return console.error(`Command ${interaction.commandName} not found.`);
    }

    try {
        await commands.get(interaction.commandName)!.executeInteraction(interaction);
    } catch (error) {
        console.error(error);
        return interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.on('ready', () => {
    console.log('Bot is logged in and ready!');
});

client.on('messageCreate', async message => {
    // This version of the bot listens on messages for commands
    if (MessageUtils.startsWith(message, prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift()?.toLowerCase() ?? 'help';

        if (commands.has(command)) {
            try {
                const commandRef = commands.get(command)!;

                commandRef.executeMessage(message, args);
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
