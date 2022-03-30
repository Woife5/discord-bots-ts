import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { ICommand, ICatgirlResponse } from '../command-interfaces';
import { NumberUtils } from '../../helpers';
import fetch from 'node-fetch';

const randomUrl = 'https://nekos.moe/api/v1/random/image';
const imageUrl = 'https://nekos.moe/image/';

async function runCommand() {
    // load result from api and parse response
    const res = await fetch(randomUrl);
    const result = (await res.json()) as ICatgirlResponse;

    const randomWord = result.images[0].tags[NumberUtils.getRandomInt(0, result.images[0].tags.length - 1)];
    const image = imageUrl + result.images[0].id;

    // send answer
    const embed = new MessageEmbed()
        .setTitle('Catgirl')
        .setDescription(`Look at this ${randomWord} catgirl i found uwu`)
        .setColor('DARK_GOLD')
        .setAuthor({
            name: 'Angry Bot',
            iconURL: 'https://cdn.discordapp.com/attachments/314440449731592192/912125148474245221/angry.png',
        })
        .setImage(image);
    return embed;
}

export const catgirl: ICommand = {
    data: new SlashCommandBuilder().setName('catgirl').setDescription('Get a random catgirl image'),
    async executeInteraction(interaction: CommandInteraction) {
        interaction.reply({ embeds: [await runCommand()] });
    },
    async executeMessage(message: Message, args: string[]) {
        message.reply({ embeds: [await runCommand()] });
    },
};
