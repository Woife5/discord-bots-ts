import { ratingEmojis, feetRelated } from "@data";
import { PluginReturnCode } from "@helpers";
import { Role } from "commands/command-interfaces";
import {
    ChannelType,
    Message,
    MessageReaction,
    PartialMessage,
    PartialMessageReaction,
    PartialUser,
    User,
} from "discord.js";
import { getRandomInt } from "helpers/number.util";
import { getMemberRole, getUserActionCache, updateUserActionCache, updateUserBalance } from "helpers/user.util";

export async function handleFeetChannelMessage(message: Message): Promise<PluginReturnCode> {
    if (!isInFeetChannel(message)) {
        return "CONTINUE";
    }

    if (message.attachments.size > 0) {
        await message.react("✅");
        await message.react("❎");
        return "ABORT";
    }

    if (!(await isFeetRelated(message.cleanContent))) {
        await message.delete();
    }

    return "DELETED";
}

export async function handleReaction(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
): Promise<PluginReturnCode> {
    if (!isInFeetChannel(reaction.message)) {
        return "CONTINUE";
    }

    const guild = reaction.message.guild;

    if (!guild) {
        return "CONTINUE";
    }

    // Check if the bot reaction is still present
    const botReactions = reaction.message.reactions.cache.filter(r => r.me);
    if (!botReactions.some(r => r.emoji.name === "✅" || r.emoji.name === "❎")) {
        return "CONTINUE";
    }

    const member = await guild.members.fetch(user.id);

    const role = await getMemberRole(member);
    if (role < Role.ADMIN) {
        return "CONTINUE";
    }

    if (reaction.emoji.name === "✅") {
        const rating = getRandomInt(0, 9);
        const emojiId = getRandomInt(0, ratingEmojis[rating].length - 1);

        const ratingEmoji = ratingEmojis[rating][emojiId];

        await reaction.message.reactions.removeAll();

        await reaction.message.reply(`${rating + 1}/10 🦶 ${ratingEmoji}`);
        await reaction.message.react("🦶");
        await reaction.message.react(ratingEmoji);

        const userId = reaction.message.author?.id;
        if (userId) {
            const userCache = getUserActionCache(userId);
            if (userCache && userCache.feetCash) {
                return "ABORT";
            }

            updateUserActionCache(userId, { feetCash: true });
            const moneyWon = (rating + 1) * 10;

            await updateUserBalance({ userId, amount: moneyWon });
            await reaction.message.reply(`You won ${moneyWon} angry coins for this awesome contribution!`);
        }

        return "ABORT";
    }

    if (reaction.emoji.name === "❎") {
        await reaction.message.delete();
    }

    return "DELETED";
}

function isInFeetChannel(message: Message | PartialMessage) {
    return !(message.channel.type !== ChannelType.GuildText || message.channel.name !== "angry-feet");
}

async function isFeetRelated(msg: string) {
    const text = msg.toLowerCase().trim();

    for (const word of feetRelated) {
        if (text.includes(word)) {
            return true;
        }
    }

    return false;
}
