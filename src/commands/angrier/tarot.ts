import { CommandInteraction, Message, MessageEmbed, User as DiscordUser } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { tarots, angryEmojis as angrys } from '../../data';
import { User, DateUtils } from '../../helpers';
import { promisify } from 'util';
const wait = promisify(setTimeout);

async function isTarotAllowed(user: DiscordUser): Promise<boolean> {
    const userData = await User.findOne({ userId: user.id });

    if (!userData) {
        return true;
    }

    if (DateUtils.isToday(userData.lastTarot)) {
        return false;
    }

    return true;
}

async function updateUserAndGetStreak(user: DiscordUser, tarot: number): Promise<number> {
    let userData = await User.findOne({ userId: user.id });

    if (!userData) {
        userData = await User.create({ userId: user.id });
    }

    userData.userName = user.username;
    userData.tarot = tarot;
    if (!userData.tarotStreak || !userData.lastTarot || DateUtils.isBeforeYesterdayMidnight(userData.lastTarot)) {
        userData.tarotStreak = 1;
    } else {
        userData.tarotStreak = userData.tarotStreak + 1;
    }
    userData.lastTarot = new Date();

    await userData.save();
    return userData.tarotStreak;
}

export const name = 'tarot';

export const slashCommandData = new SlashCommandBuilder().setName(name).setDescription('Get your daily tarot card');

export async function executeInteraction(interaction: CommandInteraction) {
    if (!(await isTarotAllowed(interaction.user))) {
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const timeLeft = midnight.getTime() - Date.now();

        interaction.reply({
            content: `You can't use this command for another ${timeLeft / (1000 * 60)} minutes!`,
            ephemeral: true,
        });
        return;
    }

    const embed = new MessageEmbed().setColor('DARK_RED').setFields({
        name: 'Angry Tarot',
        value: 'Let me sense your angry',
        inline: false,
    });

    const result = Math.floor(Math.random() * tarots.length);
    const streak = await updateUserAndGetStreak(interaction.user, result);

    await interaction.reply({ embeds: [embed] });
    for (let i = 0; i < 6; i++) {
        embed.fields[0].value += '.';
        await interaction.editReply({ embeds: [embed] });
        await wait(500);
    }

    embed.fields[0].value = `Your angry today is :angry${result + 1}: ${angrys[result]}`;
    embed.addField('Die Weißheit des angrys besagt:', tarots[result].text);
    embed.setFooter({ text: `🔥 ${streak}` });

    if (tarots[result].media) {
        embed.setImage(tarots[result].media!);
    }

    await interaction.editReply({ embeds: [embed] });
}

export async function executeMessage(message: Message, args: string[]) {
    if (!(await isTarotAllowed(message.author))) {
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const timeLeft = midnight.getTime() - Date.now();

        message.reply({
            content: `You can't use this command for another ${timeLeft / (1000 * 60)} minutes!`,
        });
        return;
    }

    message.reply('Let me sense your angry...');
    const embed = new MessageEmbed().setColor('DARK_RED').setFields({
        name: 'Angry Tarot',
        value: 'Let me sense your angry',
        inline: false,
    });

    const result = Math.floor(Math.random() * tarots.length);
    const streak = await updateUserAndGetStreak(message.author, result);

    embed.fields[0].value = `Your angry today is :angry${result + 1}: ${angrys[result]}`;
    embed.addField('Die Weißheit des angrys besagt:', tarots[result].text);
    embed.setFooter({ text: `🔥 ${streak}` });

    if (tarots[result].media) {
        embed.setImage(tarots[result].media!);
    }

    await wait(2000);

    await message.reply({ embeds: [embed] });
}
