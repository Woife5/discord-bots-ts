import { Client, Intents, Collection } from 'discord.js';
import dotenv from 'dotenv';
import { ICommand } from './commands/command-interfaces';
import * as Commands from './commands/angrier';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
});

const commands: Collection<string, ICommand> = new Collection();

Object.entries(Commands).forEach(([name, command]) => {
    commands.set(name, command);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (!commands.has(interaction.commandName)) {
        return console.error(`Command ${interaction.commandName} not found.`);
    }

    try {
        await commands.get(interaction.commandName)!.execute(interaction);
    } catch (error) {
        console.error(error);
        return interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.on('ready', () => {
    console.log('Bot is logged in and ready!');
});

client.on('messageCreate', async message => {
    // If the message includes the word "angry" add an angry reaction to the message
    if (message.content.toLowerCase().includes('angry')) {
        try {
            await message.react('😡');
        } catch (error) {
            console.error(error);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
