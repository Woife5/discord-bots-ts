import type { Message } from "discord.js";

/**
 * Checks if the clean-content of a message is the same as a given `value`.
 * Will convert both arguments to lowercase.
 */
export function compareTo(msg: Message, value: string): boolean {
    return msg.cleanContent.toLowerCase() === value.toLowerCase();
}

/**
 * Checks if the trimmed clean-content of a message starts with a given `value`.
 * Will convert both arguments to lowercase.
 */
export function startsWith(msg: Message, value: string): boolean {
    return msg.cleanContent.toLowerCase().trim().startsWith(value.toLowerCase());
}

/**
 * Checks if the content of a message contains a given `value`.
 * Will convert both arguments to lowercase.
 */
export function contains(msg: Message, value: string): boolean {
    return msg.content.toLowerCase().includes(value.toLowerCase());
}

/**
 * Checks if the clean-content of a message contains a given `value`.
 * Will convert both arguments to lowercase.
 */
export function cleanContains(msg: Message, value: string): boolean {
    return msg.cleanContent.toLowerCase().includes(value.toLowerCase());
}
