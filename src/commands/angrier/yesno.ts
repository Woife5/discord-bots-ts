import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { ICommand, IYesNo } from '../command-interfaces';
import fetch from 'node-fetch';

async function runCommand(question: string) {
    const res = await fetch('https://yesno.wtf/api');
    const result = (await res.json()) as IYesNo;

    if (!question) {
        question = 'Ehm how?';
    }

    const embed = new MessageEmbed()
        .setColor('BLUE')
        .setTitle(question)
        .setDescription(`The answer is ${result.answer}. I have spoken.`)
        .setImage(result.image);

    return embed;
}

export const yesno: ICommand = {
    data: new SlashCommandBuilder()
        .setName('yesno')
        .setDescription('Get a yes or no answer to a question.')
        .addStringOption(option =>
            option.setName('question').setDescription('Your question to the angry-oracle').setRequired(true)
        ),
    async executeInteraction(interaction: CommandInteraction) {
        const question: string = (interaction.options.get('question')?.value as string) ?? '';
        interaction.reply({ embeds: [await runCommand(question)] });
    },
    async executeMessage(message: Message, args: string[]) {
        message.reply({ embeds: [await runCommand(args.join(' '))] });
    },
};
