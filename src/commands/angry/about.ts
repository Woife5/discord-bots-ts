import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { prefix, version, angryIconCDN, repoURL } from '../../data';

function runCommand() {
    const embed = new MessageEmbed()
        .setColor('#d94d26')
        .setTitle('About')
        .addField('Regular Commands', `This bot uses regular commands with the prifix \`${prefix}\``)
        .setAuthor({
            name: 'Angry',
            iconURL: angryIconCDN,
            url: repoURL,
        })
        .setFooter({
            text: `Angry Bot v${version}`,
        });

    return embed;
}

export const name = 'about';

export const slashCommandData = new SlashCommandBuilder().setName(name).setDescription('Get information about Angry.');

export async function executeInteraction(interaction: CommandInteraction) {
    interaction.reply({ embeds: [runCommand()] });
}

export async function executeMessage(message: Message, args: string[]) {
    message.reply({ embeds: [runCommand()] });
}
