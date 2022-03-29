import { CommandInteraction, MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { ICommand } from '../command-interfaces';

import { version } from '../../data';

export const about: ICommand = {
    data: new SlashCommandBuilder().setName('about').setDescription('Get information about Angery.'),
    async execute(interaction: CommandInteraction) {
        const embed = new MessageEmbed()
            .setColor('#d94d26')
            .setTitle('About')
            .addField(
                'Invite me to your server:',
                'https://discord.com/api/oauth2/authorize?client_id=889871547152617542&permissions=0&scope=bot%20applications.commands'
            )
            .addField(
                'Slash Commands',
                "This bot uses Slash Commands! Just type a '/' and have a look at all the commands! 😡"
            )
            .setAuthor({
                name: 'Angry',
                iconURL: 'https://cdn.discordapp.com/attachments/314440449731592192/912125148474245221/angry.png',
                url: 'https://github.com/Woife5/angrier-bot',
            })
            .setFooter({
                text: `Angrier Bot v${version}`,
            });

        interaction.reply({ embeds: [embed] });
    },
};
