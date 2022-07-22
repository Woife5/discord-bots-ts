import { CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { ConfigCache } from '@helpers';
import { prefix } from '@data';
import { getEmbed } from './censored';

async function updateConfig(subcommand: 'add' | 'remove', value: string) {
    const config = await ConfigCache.get('censored');

    let newConfig = [];
    if (subcommand === 'add') {
        if (!config) {
            await ConfigCache.set('censored', { value: [value] });
            return;
        }

        if (config.includes(value)) {
            return;
        }

        newConfig = [...config, value];
    }

    if (subcommand === 'remove' && config) {
        newConfig = config.filter((v: string) => v !== value);
    }

    await ConfigCache.set('censored', newConfig);
}

export const name = 'censorship';

export const slashCommandData = new SlashCommandBuilder()
    .setName(name)
    .setDescription('Add or remove a censored string.');

export async function executeInteraction(interaction: CommandInteraction) {
    await interaction.reply({ embeds: [await getEmbed()] });
}

export async function executeMessage(message: Message, args: string[]) {
    if (args.length < 2) {
        await message.reply('Please provide two arguments! `add` or `remove` and the string to add or remove.');
        return;
    }
    const subcommand = args.shift()?.toLowerCase().trim();
    const censoredString = args.shift()?.toLowerCase().trim();

    if (!censoredString) {
        return;
    }

    if (subcommand === 'add' || subcommand === 'remove') {
        await updateConfig(subcommand, censoredString);
        await message.reply({ embeds: [await getEmbed()] });
    } else {
        await message.reply(`Not a valid command. Proper usage would be:\n\`${prefix} censorship <add/remove> string\``);
    }
}
