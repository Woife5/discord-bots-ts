import { ratingEmojis, feetRelated } from "@data";
import type { PluginReturnCode } from "@woife5/shared/lib/messages/message-wrapper";
import { Role } from "@woife5/shared/lib/commands/types.d";
import {
    ChannelType,
    Message,
    MessageReaction,
    PartialMessage,
    PartialMessageReaction,
    PartialUser,
    User,
} from "discord.js";
import { getRandomInt } from "@woife5/shared/lib/utils/number.util";
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
        // accept the vote if more than 3 people vote for yes
        const count = reaction.count ?? 0;
        if (count > 3 && reaction.emoji.name === "✅") {
            return await handleAcceptedFeetImage(reaction.message);
        }

        if (count > 3 && reaction.emoji.name === "❎") {
            await reaction.message.delete();
            return "DELETED";
        }

        return "CONTINUE";
    }

    if (reaction.emoji.name === "✅") {
        return await handleAcceptedFeetImage(reaction.message);
    }

    if (reaction.emoji.name === "❎") {
        await reaction.message.delete();
    }

    return "DELETED";
}

async function handleAcceptedFeetImage(message: Message | PartialMessage): Promise<PluginReturnCode> {
    const rating = getRandomInt(0, 9);
    const emojiId = getRandomInt(0, ratingEmojis[rating].length - 1);

    const ratingEmoji = ratingEmojis[rating][emojiId];

    await message.reactions.removeAll();

    await message.reply(`${rating + 1}/10 🦶 ${ratingEmoji}`);
    await message.react("🦶");
    await message.react(ratingEmoji);

    const userId = message.author?.id;
    if (userId) {
        const userCache = getUserActionCache(userId);
        if (userCache && userCache.feetCash) {
            return "ABORT";
        }

        updateUserActionCache(userId, { feetCash: true });
        let moneyWon = (rating + 1) * 20;

        if (message.attachments.some(a => a.contentType?.includes("video"))) {
            moneyWon *= 2;
        }

        if (new Date().getDay() === 5) {
            moneyWon *= 2;
        }

        await updateUserBalance({ userId, amount: moneyWon });
        await message.reply(`You won ${moneyWon} angry coins for this awesome contribution!`);
    }

    return "ABORT";
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
