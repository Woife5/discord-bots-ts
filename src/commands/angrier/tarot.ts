import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { ICommand } from '../command-interfaces';
import { tarots, angryEmojis as angrys } from '../../data';
import { promisify } from 'util';
const wait = promisify(setTimeout);

const cooldowns = new Map<string, number>();

export const tarot: ICommand = {
    data: new SlashCommandBuilder().setName('tarot').setDescription('Get your daily tarot card'),
    async executeInteraction(interaction: CommandInteraction) {
        if (cooldowns.has(interaction.user.id)) {
            const timeLeft = cooldowns.get(interaction.user.id)! - Date.now();
            if (timeLeft > 0) {
                interaction.reply({
                    content: `You can't use this command for another ${timeLeft / (1000 * 60)} minutes!`,
                    ephemeral: true,
                });
                return;
            }
        }

        cooldowns.set(interaction.user.id, Date.now() + 1000 * 60 * 60 * 24);

        const embed = new MessageEmbed().setColor('DARK_RED').setFields({
            name: 'Angry Tarot',
            value: 'Let me sense your angry',
            inline: false,
        });

        await interaction.reply({ embeds: [embed] });
        for (let i = 0; i < 6; i++) {
            embed.fields[0].value += '.';
            await interaction.editReply({ embeds: [embed] });
            await wait(500);
        }

        const result = Math.floor(Math.random() * tarots.length);
        embed.fields[0].value = `Your angry today is :angry${result + 1}: ${angrys[result]}`;
        embed.addField('Die Weißheit des angrys besagt:', tarots[result].text);

        if (tarots[result].media) {
            embed.setImage(tarots[result].media!);
        }

        await interaction.editReply({ embeds: [embed] });
    },
    async executeMessage(message: Message, args: string[]) {
        const msg = await message.reply("You can't use this command here!");
    },
};
