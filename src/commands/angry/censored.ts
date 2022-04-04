import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { ICommand } from '../command-interfaces';
import { Config } from '../../helpers';

async function getEmbed() {
    const config = await Config.findOne({ key: 'censored' }).exec();

    if (!config) {
        return new MessageEmbed().setColor('#d94d26').setTitle('No consored strings found!');
    }

    const censored = '`' + config.value.join('`, `') + '`';

    const embed = new MessageEmbed().setTitle('Censored Strings:').setDescription(censored);
    return embed;
}

export const censored: ICommand = {
    data: new SlashCommandBuilder().setName('censored').setDescription('Find out which emojis are censored.'),
    async executeInteraction(interaction: CommandInteraction) {
        interaction.reply({ embeds: [await getEmbed()] });
    },
    async executeMessage(message: Message, args: string[]) {
        message.reply({ embeds: [await getEmbed()] });
    },
};
