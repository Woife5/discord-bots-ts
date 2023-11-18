import { angryEmojis, tarots } from "@data";
import { incrementStatAndUser } from "@helpers";
import { ChatInputCommandInteraction, EmbedBuilder, User as DiscordUser, SlashCommandBuilder } from "discord.js";
import { getUser, updateUser } from "helpers/user.util";
import { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { isBeforeYesterdayMidnight, isToday } from "@woife5/shared/lib/utils/date.util";

const currentlyHandling = new Set<string>();

export const tarot: CommandHandler = {
    data: new SlashCommandBuilder().setName("tarot").setDescription("Get your daily angry tarot reading."),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const notAllowed = await isTarotAllowed(interaction.user);
        if (notAllowed) {
            await interaction.reply({
                content: notAllowed,
                ephemeral: true,
            });
            return;
        }
        currentlyHandling.add(interaction.user.id);

        const embed = defaultEmbed();

        const result = Math.floor(Math.random() * tarots.length);

        await interaction.reply({ embeds: [embed] });
        for (let i = 0; i < 6; i++) {
            embed.spliceFields(0, 1, {
                name: "Angry Tarot",
                value: `Let me sense your angry${".".repeat(i + 1)}`,
            });
            await interaction.editReply({ embeds: [embed] });
            await Bun.sleep(500);
        }

        const streak = await updateUserAndGetStreak(interaction.user, result);
        await setFields(embed, result, streak);

        await interaction.editReply({ embeds: [embed] });
        await incrementStatAndUser("tarots-read", interaction.user);
        currentlyHandling.delete(interaction.user.id);
    },
};

const defaultEmbed = () => {
    return new EmbedBuilder().setColor("DarkRed").setFields({
        name: "Angry Tarot",
        value: "Let me sense your angry",
    });
};

async function isTarotAllowed(user: DiscordUser): Promise<string | null> {
    if (currentlyHandling.has(user.id)) {
        return "You can't use this command right now!";
    }

    const userData = await getUser(user.id);

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
    const u = await getUser(user.id);

    let tarotStreak = 1;
    let angryCoins: number;

    if (!u) {
        angryCoins = Math.ceil(tarotId / 2);
    } else {
        if (!isBeforeYesterdayMidnight(u?.lastTarot)) {
            tarotStreak = u.tarotStreak + 1;
        }
        angryCoins = u.angryCoins + Math.ceil(tarotId / 2);
    }

    updateUser(user.id, {
        lastTarot: new Date(),
        userName: user.username,
        tarot: tarotId,
        angryCoins,
        tarotStreak,
    });

    return tarotStreak;
}

async function setFields(embed: EmbedBuilder, tarotId: number, streak: number) {
    embed.spliceFields(0, 1, {
        name: "Angry Tarot",
        value: `Your angry today is ${angryEmojis[tarotId]}`,
    });

    if (tarots[tarotId].text) {
        embed.addFields({ name: "Angry's wisdom states:", value: tarots[tarotId].text.substring(0, 1023) });
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
