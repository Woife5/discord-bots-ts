import { ratingEmojis } from "@data";
import { ConfigCache, getMemberRole, NumberUtils, PluginReturnCode } from "@helpers";
import { Role } from "commands/command-interfaces";
import { Message, MessageReaction, PartialMessage, PartialMessageReaction, PartialUser, User } from "discord.js";

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

    const member = await guild.members.fetch(user.id);

    const role = await getMemberRole(member);
    if (role < Role.ADMIN) {
        return "CONTINUE";
    }

    if (reaction.emoji.name === "✅") {
        const rating = NumberUtils.getRandomInt(0, 9);
        const emojiId = NumberUtils.getRandomInt(0, ratingEmojis[rating].length - 1);

        const ratingEmoji = ratingEmojis[rating][emojiId];

        await reaction.message.reactions.removeAll();

        await reaction.message.reply(`${rating + 1}/10 🦶 ${ratingEmoji}`);
        await reaction.message.react("🦶");
        await reaction.message.react(ratingEmoji);

        return "ABORT";
    }

    if (reaction.emoji.name === "❎") {
        await reaction.message.delete();
    }

    return "DELETED";
}

function isInFeetChannel(message: Message | PartialMessage) {
    return !(message.channel.type !== "GUILD_TEXT" || message.channel.name !== "angry-feet");
}

async function isFeetRelated(msg: string) {
    const text = msg.toLowerCase().trim();

    const config = await ConfigCache.get("feet-related");

    if (!config) {
        return false;
    }

    const feetRelated = config as string[];

    for (const word of feetRelated) {
        if (text.includes(word)) {
            return true;
        }
    }

    return false;
}
