import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { ICommand } from '../command-interfaces';
import { angryBirthday } from '../../data';
import { DateUtils } from '../../helpers';

function getEmbed() {
    const nextBirthday = new Date(angryBirthday);
    nextBirthday.setFullYear(new Date().getFullYear());
    if (nextBirthday < new Date()) {
        nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
    }

    const embed = new MessageEmbed()
        .setColor('#d94d26')
        .setTitle('MY BIRTHDAY')
        .setDescription(
            `My birthday is on ${angryBirthday.toLocaleDateString('de-AT')}, in ${Math.round(
                DateUtils.daysUntil(nextBirthday)
            )} days.`
        )
        .setAuthor({
            name: 'Angry',
            iconURL: 'https://cdn.discordapp.com/attachments/314440449731592192/912125148474245221/angry.png',
            url: 'https://github.com/Woife5/angrier-bot',
        });

    return embed;
}

export const birthday: ICommand = {
    data: new SlashCommandBuilder().setName('about').setDescription('Get information about Angery.'),
    async executeInteraction(interaction: CommandInteraction) {
        interaction.reply({ embeds: [getEmbed()] });
    },
    async executeMessage(message: Message, args: string[]) {
        message.reply({ embeds: [getEmbed()] });
    },
};
