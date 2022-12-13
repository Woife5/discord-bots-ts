import { CommandInteraction, Message, EmbedBuilder, User as DiscordUser } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { tarots, angryEmojis as angrys } from "@data";
import { User, createUser, incrementStatAndUser } from "@helpers";
import { promisify } from "util";
import { isBeforeYesterdayMidnight, isToday } from "shared/lib/utils/date.util";
import { CommandHandler } from "shared/lib/commands/types.d";
const wait = promisify(setTimeout);

export const tarot: CommandHandler = {
    data: new SlashCommandBuilder().setName("tarot").setDescription("Get your daily angry tarot reading."),
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
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
            embed.spliceFields(0, 1, {
                name: "Angry Tarot",
                value: `Let me sense your angry${".".repeat(i + 1)}`,
            });
            await interaction.editReply({ embeds: [embed] });
            await wait(500);
        }

        await setFields(embed, result, interaction.user);

        await interaction.editReply({ embeds: [embed] });
        await incrementStatAndUser("tarots-read", interaction.user);
    },
    executeMessage: async (message: Message): Promise<void> => {
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
    },
};

async function isTarotAllowed(user: DiscordUser): Promise<string | null> {
    const userData = await User.findOne({ userId: user.id });

    if (!userData) {
        return null;
    }

    if (isToday(userData.lastTarot)) {
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const timeLeft = midnight.getTime() - Date.now();

        return `You can't use this command for another ${timeLeft / (1000 * 60)} minutes!`;
    }

    return null;
}

async function updateUserAndGetStreak(user: DiscordUser, tarotId: number): Promise<number> {
    let userData = await User.findOne({ userId: user.id });

    if (!userData) {
        userData = await createUser(user);
    }

    userData.userName = user.username;
    userData.tarot = tarotId;
    userData.angryCoins = userData.angryCoins + Math.ceil(tarotId / 2);
    if (isBeforeYesterdayMidnight(userData.lastTarot)) {
        userData.tarotStreak = 1;
    } else {
        userData.tarotStreak = userData.tarotStreak + 1;
    }
    userData.lastTarot = new Date();

    await userData.save();
    return userData.tarotStreak;
}

function createEmbed(): EmbedBuilder {
    return new EmbedBuilder().setColor("DarkRed").setFields({
        name: "Angry Tarot",
        value: "Let me sense your angry",
        inline: false,
    });
}

async function setFields(embed: EmbedBuilder, tarotId: number, user: DiscordUser) {
    const streak = await updateUserAndGetStreak(user, tarotId);

    embed.spliceFields(0, 1, {
        name: "Angry Tarot",
        value: `Your angry today is :angry${tarotId + 1}: ${angrys[tarotId]}`,
    });

    if (tarots[tarotId].text) {
        embed.addFields({ name: "Die Weißheit des angrys besagt:", value: tarots[tarotId].text });
    }

    if (tarots[tarotId].media) {
        embed.setImage(String(tarots[tarotId].media));
    }

    embed.addFields({ name: "Angry Coins", value: `You earned ${Math.ceil(tarotId / 2)} angry coins for this tarot!` });

    if (streak % 100 === 0) {
        const numberOfEmojis = streak / 100;
        embed.setFooter({ text: `🔥 ${"💯".repeat(numberOfEmojis)}` });
    } else {
        embed.setFooter({ text: `🔥 ${streak}` });
    }
}
