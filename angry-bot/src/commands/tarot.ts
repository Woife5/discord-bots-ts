import { CommandInteraction, Message, MessageEmbed, User as DiscordUser } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { tarots, angryEmojis as angrys } from "@data";
import { User, DateUtils, createUser, incrementStatAndUser } from "@helpers";
import { promisify } from "util";
const wait = promisify(setTimeout);

async function isTarotAllowed(user: DiscordUser): Promise<string | null> {
    const userData = await User.findOne({ userId: user.id });

    if (!userData) {
        return null;
    }

    if (DateUtils.isToday(userData.lastTarot)) {
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const timeLeft = midnight.getTime() - Date.now();

        return `You can't use this command for another ${timeLeft / (1000 * 60)} minutes!`;
    }

    return null;
}

async function updateUserAndGetStreak(user: DiscordUser, tarot: number): Promise<number> {
    let userData = await User.findOne({ userId: user.id });

    if (!userData) {
        userData = await createUser(user);
    }

    userData.userName = user.username;
    userData.tarot = tarot;
    if (DateUtils.isBeforeYesterdayMidnight(userData.lastTarot)) {
        userData.tarotStreak = 1;
    } else {
        userData.tarotStreak = userData.tarotStreak + 1;
    }
    userData.lastTarot = new Date();

    await userData.save();
    return userData.tarotStreak;
}

function createEmbed(): MessageEmbed {
    return new MessageEmbed().setColor("DARK_RED").setFields({
        name: "Angry Tarot",
        value: "Let me sense your angry",
        inline: false,
    });
}

async function setFields(embed: MessageEmbed, tarot: number, user: DiscordUser) {
    const streak = await updateUserAndGetStreak(user, tarot);

    embed.fields[0].value = `Your angry today is :angry${tarot + 1}: ${angrys[tarot]}`;

    if (tarots[tarot].text) {
        embed.addField("Die Weißheit des angrys besagt:", tarots[tarot].text);
    }

    if (tarots[tarot].media) {
        embed.setImage(String(tarots[tarot].media));
    }

    embed.setFooter({ text: `🔥 ${streak}` });
}

export const name = "tarot";

export const slashCommandData = new SlashCommandBuilder().setName(name).setDescription("Get your daily tarot card");

export async function executeInteraction(interaction: CommandInteraction) {
    const notAllowed = await isTarotAllowed(interaction.user);
    if (notAllowed) {
        await interaction.reply({
            content: notAllowed,
            ephemeral: true,
        });
        return;
    }

    const embed = createEmbed();

    const result = Math.floor(Math.random() * tarots.length);

    await interaction.reply({ embeds: [embed] });
    for (let i = 0; i < 6; i++) {
        embed.fields[0].value += ".";
        await interaction.editReply({ embeds: [embed] });
        await wait(500);
    }

    await setFields(embed, result, interaction.user);

    await interaction.editReply({ embeds: [embed] });
    await incrementStatAndUser("tarots-read", interaction.user);
}

export async function executeMessage(message: Message) {
    const notAllowed = await isTarotAllowed(message.author);
    if (notAllowed) {
        message.reply({
            content: notAllowed,
        });
        return;
    }

    message.reply("Let me sense your angry...");
    const embed = createEmbed();

    const result = Math.floor(Math.random() * tarots.length);
    await setFields(embed, result, message.author);

    await wait(2000);

    await message.reply({ embeds: [embed] });
    await incrementStatAndUser("tarots-read", message.author);
}
