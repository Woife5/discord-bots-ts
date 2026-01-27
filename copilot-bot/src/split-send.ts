import { MessageFlags, type PartialTextBasedChannelFields, TextDisplayBuilder } from "discord.js";

const MAX_LENGTH = 2000;

// Markdown patterns that come in pairs and shouldn't be split
const MARKDOWN_PAIRS = [
    { pattern: /```/g, name: "code block" }, // Code blocks
    { pattern: /``/g, name: "inline code" }, // Double backtick inline code
    { pattern: /`/g, name: "inline code" }, // Single backtick inline code
    { pattern: /\*\*/g, name: "bold" }, // Bold
    { pattern: /__/g, name: "underline bold" }, // Underline/bold
    { pattern: /\|\|/g, name: "spoiler" }, // Spoilers
    { pattern: /~~/g, name: "strikethrough" }, // Strikethrough
    { pattern: /(?<!\*)\*(?!\*)/g, name: "italic" }, // Italic (single asterisk, not part of bold)
    { pattern: /(?<!_)_(?!_)/g, name: "italic" }, // Italic (single underscore, not part of underline)
];

/**
 * Counts occurrences of a pattern in a string
 */
function countMatches(text: string, pattern: RegExp): number {
    const matches = text.match(pattern);
    return matches ? matches.length : 0;
}

/**
 * Checks if a chunk has unclosed markdown formatting
 */
function hasUnclosedMarkdown(chunk: string): { unclosed: boolean; pattern?: RegExp } {
    for (const { pattern } of MARKDOWN_PAIRS) {
        const count = countMatches(chunk, pattern);
        // If odd number of occurrences, the formatting is unclosed
        if (count % 2 !== 0) {
            return { unclosed: true, pattern };
        }
    }
    return { unclosed: false };
}

/**
 * Finds the last safe split point that doesn't break markdown formatting
 */
function findSafeSplitPoint(text: string, maxLength: number): number {
    // First, try to split at a newline for cleaner breaks
    const lastNewline = text.lastIndexOf("\n", maxLength);
    if (lastNewline > maxLength * 0.5) {
        // Check if splitting here would break markdown
        const chunk = text.slice(0, lastNewline);
        if (!hasUnclosedMarkdown(chunk).unclosed) {
            return lastNewline + 1; // Include the newline in the first chunk
        }
    }

    // Try to find a safe split point by checking progressively shorter chunks
    // Prioritize splitting at paragraph breaks (double newlines)
    const lastParagraph = text.lastIndexOf("\n\n", maxLength);
    if (lastParagraph > maxLength * 0.3) {
        const chunk = text.slice(0, lastParagraph);
        if (!hasUnclosedMarkdown(chunk).unclosed) {
            return lastParagraph + 2;
        }
    }

    // Try splitting at code block boundaries (```)
    const codeBlockRegex = /```[\s\S]*?```/g;
    let lastCodeBlockEnd = 0;
    let match: RegExpExecArray | null;
    const textToSearch = text.slice(0, maxLength);

    // biome-ignore lint/suspicious/noAssignInExpressions: it works
    while ((match = codeBlockRegex.exec(textToSearch)) !== null) {
        const endPos = match.index + match[0].length;
        if (endPos <= maxLength) {
            lastCodeBlockEnd = endPos;
        }
    }

    if (lastCodeBlockEnd > maxLength * 0.3) {
        return lastCodeBlockEnd;
    }

    // Fall back to finding a safe point by checking each potential split
    // Work backwards from maxLength, preferring spaces/newlines
    for (let i = maxLength; i > maxLength * 0.3; i--) {
        const char = text[i];
        if (char === "\n" || char === " ") {
            const chunk = text.slice(0, i);
            if (!hasUnclosedMarkdown(chunk).unclosed) {
                return char === "\n" ? i + 1 : i;
            }
        }
    }

    // If we couldn't find a safe markdown break point, just split at a space
    const lastSpace = text.lastIndexOf(" ", maxLength);
    if (lastSpace > maxLength * 0.3) {
        return lastSpace;
    }

    // Last resort: hard split at maxLength
    return maxLength;
}

/**
 * Splits a message into chunks respecting markdown formatting boundaries
 */
function splitMessageSafely(message: string): string[] {
    const chunks: string[] = [];
    let remaining = message;

    while (remaining.length > 0) {
        if (remaining.length <= MAX_LENGTH) {
            chunks.push(remaining);
            break;
        }

        const splitPoint = findSafeSplitPoint(remaining, MAX_LENGTH);
        const chunk = remaining.slice(0, splitPoint).trim();

        if (chunk.length > 0) {
            chunks.push(chunk);
        }

        remaining = remaining.slice(splitPoint).trim();
    }

    return chunks;
}

async function send(message: string, channel: PartialTextBasedChannelFields) {
    const text = new TextDisplayBuilder().setContent(message);
    await channel.send({ components: [text], flags: MessageFlags.IsComponentsV2 });
}

export async function splitAndSendAsComponents(message: string, channel: PartialTextBasedChannelFields) {
    if (message.length > MAX_LENGTH) {
        const chunks = splitMessageSafely(message);
        for (const chunk of chunks) {
            await send(chunk, channel);
        }
    } else {
        await send(message, channel);
    }
}
