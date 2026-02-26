import type { Message } from "discord.js";

/**
 * Checks if the clean-content of a message contains a given `value`.
 * Will convert both arguments to lowercase.
 */
export function cleanContains(msg: Message, value: string): boolean {
    return msg.cleanContent.toLowerCase().includes(value.toLowerCase());
}
