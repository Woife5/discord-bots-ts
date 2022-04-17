import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Config } from '@helpers';

export async function getEmbed() {
    const config = await Config.findOne({ key: 'censored' }).exec();

    if (!config) {
        return new MessageEmbed().setColor('#d94d26').setTitle('No consored strings found!');
    }

    let censored = '';
    if (config.value.length > 0) {
        censored = '`' + config.value.join('`, `') + '`';
    } else {
        censored = 'None';
    }

    const embed = new MessageEmbed().setTitle('Censored Strings:').setDescription(censored);
    return embed;
}

export const name = 'censored';

export const slashCommandData = new SlashCommandBuilder()
    .setName(name)
    .setDescription('Find out which emojis are censored.');

export async function executeInteraction(interaction: CommandInteraction) {
    interaction.reply({ embeds: [await getEmbed()] });
}

export async function executeMessage(message: Message, args: string[]) {
    message.reply({ embeds: [await getEmbed()] });
}
