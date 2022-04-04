import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { ICommand } from '../command-interfaces';
import { prefix, version } from '../../data';

function runCommand() {
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
        .addField('Regular Commands', `This bot also uses regular commands with the prifix \`${prefix}\``)
        .setAuthor({
            name: 'Angry',
            iconURL: 'https://cdn.discordapp.com/attachments/314440449731592192/912125148474245221/angry.png',
            url: 'https://github.com/Woife5/angrier-bot',
        })
        .setFooter({
            text: `Angrier Bot v${version}`,
        });

    return embed;
}

export const about: ICommand = {
    data: new SlashCommandBuilder().setName('about').setDescription('Get information about Angery.'),
    async executeInteraction(interaction: CommandInteraction) {
        interaction.reply({ embeds: [runCommand()] });
    },
    async executeMessage(message: Message, args: string[]) {
        message.reply({ embeds: [runCommand()] });
    },
};
