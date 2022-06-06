import { ratingEmojis } from '@data';
import { Config, NumberUtils } from '@helpers';
import { Message, MessageReaction, PartialMessage, PartialMessageReaction, PartialUser, User } from 'discord.js';

// Function return false if the message is not in the feet channel
// and therefore not applicable to this handler.

export async function handleFeetChannelMessage(message: Message) {
    if (!isInFeetChannel(message)) {
        return false;
    }

    if (message.attachments.size > 0) {
        await message.react('✅');
        await message.react('❎');
        return true;
    }

    if (!(await isFeetRelated(message.cleanContent))) {
        await message.delete();
    }

    return true;
}

export async function handleReaction(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
    if (!isInFeetChannel(reaction.message)) {
        return false;
    }

    const guild = reaction.message.guild;

    if (!guild) {
        return false;
    }

    const member = await guild.members.fetch(user.id);

    const adminId = '824234599936557097';
    if (!member.roles.cache.has(adminId)) {
        return false;
    }

    if (reaction.emoji.name === '✅') {
        const rating = NumberUtils.getRandomInt(0, 10);
        const emojiId = NumberUtils.getRandomInt(0, ratingEmojis[rating].length - 1);

        const ratingEmoji = ratingEmojis[rating][emojiId];

        await reaction.message.reactions.removeAll();

        await reaction.message.reply(`${rating + 1}/10 🦶 ${ratingEmoji}`);
        await reaction.message.react('🦶');
        await reaction.message.react(ratingEmoji);

        return true;
    }

    if (reaction.emoji.name === '❎') {
        await reaction.message.delete();
    }

    return true;
}

function isInFeetChannel(message: Message | PartialMessage) {
    if (message.channel.type !== 'GUILD_TEXT' || message.channel.name !== 'angry-feet') {
        return false;
    }

    return true;
}

async function isFeetRelated(msg: string) {
    const text = msg.toLowerCase().trim();

    const config = await Config.findOne({ key: 'feet-related' }).exec();

    if (!config) {
        return false;
    }

    const feetRelated = config.value as string[];

    for (const word of feetRelated) {
        if (text.includes(word)) {
            return true;
        }
    }

    return false;
}
