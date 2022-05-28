import { Message } from 'discord.js';

export async function handleFeetChannelMessage(message: Message) {
    if (message.channel.type !== 'GUILD_TEXT') {
        return false;
    }

    if (message.channel.name !== 'angry-feet') {
        return false;
    }

    if (!isFeetRelated(message.cleanContent) && message.attachments.size <= 0) {
        await message.delete();
    }

    if (message.attachments.size > 0) {
        await message.react('✅');
        await message.react('❎');
    }

    return true;
}

// TODO create reaction handler

function isFeetRelated(msg: string): boolean {
    const text = msg.toLowerCase().trim();

    // TODO move this to db
    const feetRelated = ['🦵', '🦶', '👣', '🐾', 'fuß', 'feet', 'fuss', 'foot', 'füsse', 'füße', 'leg', 'bein'];

    for (const word of feetRelated) {
        if (text.includes(word)) {
            return true;
        }
    }

    return false;
}
