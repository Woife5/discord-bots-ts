import type { CommandInteraction, Message, User } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { User as DbUser, createUser } from '@helpers';

async function updateReminder(user: User, subcommand: 'enable' | 'disable') {
    let dbUser = await DbUser.findOne({ userId: user.id }).exec();

    if (!dbUser) {
        dbUser = await createUser(user);
    }

    dbUser.tarotreminder = subcommand === 'enable';
    await dbUser.save();
}

export const name = 'tarotreminder';

export const slashCommandData = new SlashCommandBuilder().setName(name).setDescription('Get my next birthday.');

export function executeInteraction(interaction: CommandInteraction) {
    interaction.reply('Not implemented yet');
}

export async function executeMessage(message: Message, args: string[]) {
    if (args.length === 0) {
        message.reply('No arguments provided!');
        return;
    }

    if (args[0] === 'enable' || args[0] === 'disable') {
        await updateReminder(message.author, args[0]);
        message.reply(`Tarot reminder ${args[0]}d`);
        return;
    }

    message.reply('Invalid argument!');
}
