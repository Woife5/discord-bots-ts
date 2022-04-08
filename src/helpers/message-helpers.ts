import { Message } from 'discord.js';

export class MessageUtils {
    static compareTo(msg: Message, value: string): boolean {
        return msg.cleanContent.toLowerCase() === value.toLowerCase();
    }

    static startsWith(msg: Message, value: string): boolean {
        return msg.cleanContent.toLowerCase().trim().startsWith(value.toLowerCase());
    }

    static contains(msg: Message, value: string): boolean {
        return msg.cleanContent.toLowerCase().includes(value.toLowerCase());
    }
}
