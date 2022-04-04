import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { ICommand } from '../command-interfaces';
import { Config } from '../../helpers';
import { prefix } from '../../data';

async function getEmbed() {
    const config = await Config.findOne({ key: 'censored' }).exec();

    if (!config) {
        return new MessageEmbed().setColor('#d94d26').setTitle('No consored strings found!');
    }

    const censored = '`' + config.value.join('`, `') + '`';

    const embed = new MessageEmbed().setTitle('Censored Strings:').setDescription(censored);
    return embed;
}

async function updateConfig(subcommand: 'add' | 'remove', value: string) {
    const config = await Config.findOne({ key: 'censored' }).exec();

    if (subcommand === 'add') {
        if (!config) {
            await Config.create({ key: 'censored', value: [value] });
        } else {
            config.value = [...config.value, value];
            await config.save();
        }
    }

    if (subcommand === 'remove' && config) {
        config.value = config.value.filter((v: string) => v !== value);
        await config.save();
    }
}

export const censorship: ICommand = {
    data: new SlashCommandBuilder().setName('censorship').setDescription('Add or remove a censored string.'),
    async executeInteraction(interaction: CommandInteraction) {
        interaction.reply({ embeds: [await getEmbed()] });
    },
    async executeMessage(message: Message, args: string[]) {
        if (args.length < 2) {
            message.reply('Please provide two arguments! `add` or `remove` and the string to add or remove.');
            return;
        }
        const subcommand = args.shift()!.toLowerCase().trim();
        const censoredString = args.shift()!.toLowerCase().trim();

        if (subcommand === 'add' || subcommand === 'remove') {
            await updateConfig(subcommand, censoredString);
            message.reply({ embeds: [await getEmbed()] });
        } else {
            message.reply(`Not a valid command. Proper usage would be:\n\`${prefix} censorship <add/remove> string\``);
        }
    },
};
