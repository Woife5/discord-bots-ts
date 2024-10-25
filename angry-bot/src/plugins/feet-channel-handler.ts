import { feetInsults, feetRelated, ratingEmojis } from "@data";
import { Role } from "@woife5/shared/lib/commands/types.d";
import type { PluginReturnCode } from "@woife5/shared/lib/messages/message-wrapper";
import { getRandomInt } from "@woife5/shared/lib/utils/number.util";
import {
    AttachmentBuilder,
    ChannelType,
    type GuildMember,
    type Message,
    type MessageReaction,
    type PartialMessage,
    type PartialMessageReaction,
    type PartialUser,
    type User,
} from "discord.js";
import { getMemberRole, getUserActionCache, updateUserActionCache, updateUserBalance } from "helpers/user.util";

const HANDLING_MESSAGES = new Set<string>();
setInterval(() => HANDLING_MESSAGES.clear(), 1000 * 60 * 60 * 24);

export async function handleFeetChannelMessage(message: Message): Promise<PluginReturnCode> {
    if (!isInFeetChannel(message)) {
        return "CONTINUE";
    }

    if (message.attachments.size > 0) {
        await message.react("✅");
        await message.react("❎");
        await message.react("❌");
        return "ABORT";
    }

    if (!isFeetRelated(message.cleanContent)) {
        await message.delete();
    }

    return "DELETED";
}

export async function handleReaction(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
): Promise<PluginReturnCode> {
    if (!isInFeetChannel(reaction.message)) {
        return "CONTINUE";
    }

    const guild = reaction.message.guild;

    if (!guild) {
        return "CONTINUE";
    }

    // Check if the bot reaction is still present
    const botReactions = reaction.message.reactions.cache.filter((r) => r.me);
    if (!botReactions.some((r) => r.emoji.name === "✅" || r.emoji.name === "❎")) {
        return "CONTINUE";
    }

    HANDLING_MESSAGES.add(reaction.message.id);
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

        if (count > 3 && reaction.emoji.name === "❌") {
            handleAwfulFeetImage(reaction.message, member);
        }

        return "CONTINUE";
    }

    if (reaction.emoji.name === "✅") {
        return await handleAcceptedFeetImage(reaction.message);
    }

    if (reaction.emoji.name === "❎") {
        await reaction.message.delete();
    }

    if (reaction.emoji.name === "❌") {
        handleAwfulFeetImage(reaction.message, member);
    }

    return "DELETED";
}

async function handleAwfulFeetImage(message: Message | PartialMessage, author: GuildMember): Promise<PluginReturnCode> {
    const punishment = getRandomInt(5, 10) * 10;
    await updateUserBalance({ userId: author.id, amount: -punishment });

    // we can assume that the first attachment exists as otherwise we would not get here
    const attachment = message.attachments.first();
    if (!attachment) {
        return "CONTINUE";
    }

    const buffer = await fetch(attachment.url)
        .then((r) => r.blob())
        .then((b) => b.arrayBuffer())
        .then((b) => Buffer.from(b));

    const files = [new AttachmentBuilder(buffer).setName("censored.png").setSpoiler(true)];
    if (!message.channel.isSendable()) {
        return "ABORT";
    }

    const censored = await message.channel.send({ files });
    await message.delete();
    await censored.reply(
        `What the fuck was that supposed to be?? 🤮🤮🤮 ${author}\nI will take ${punishment} coins from you for that 🤢🤮`,
    );

    // Send a follow-up message 45 minutes to 2 hours after the image was deleted
    setTimeout(
        () => {
            author.send(feetInsults[getRandomInt(0, feetInsults.length - 1)]);
        },
        1000 * 60 * getRandomInt(45, 120),
    );

    // Send another follow-up after 4 hours
    setTimeout(
        async () => {
            await author.send("I think i will have to deduct even more money ... It was baaad!");
            await updateUserBalance({ userId: author.id, amount: -10 });
        },
        1000 * 60 * 240,
    );

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
        if (userCache?.feetCash) {
            return "ABORT";
        }

        updateUserActionCache(userId, { feetCash: true });
        let moneyWon = (rating + 1) * 20;

        if (message.attachments.some((a) => a.contentType?.includes("video"))) {
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

function isFeetRelated(msg: string) {
    const text = msg.toLowerCase().trim();

    for (const word of feetRelated) {
        if (text.includes(word)) {
            return true;
        }
    }

    return false;
}
