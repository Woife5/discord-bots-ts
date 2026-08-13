const DISCORD_MESSAGE_LIMIT = 2000;

/**
 * Splits text into chunks that fit into a single Discord message.
 *
 * Boundaries are preferred in this order: paragraph, line, word, grapheme.
 * Graphemes are used as the last resort so surrogate pairs and emoji
 * sequences are never cut in half, which a plain `slice` would do.
 */
export function chunkForDiscord(text: string, limit: number = DISCORD_MESSAGE_LIMIT): Array<string> {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
        return [];
    }

    if (trimmed.length <= limit) {
        return [trimmed];
    }

    const chunks: Array<string> = [];
    let current = "";

    for (const paragraph of splitKeepingSeparator(trimmed, "\n\n")) {
        for (const piece of fitPieces(paragraph, limit)) {
            if (current.length === 0) {
                current = piece;
                continue;
            }

            if (current.length + piece.length <= limit) {
                current += piece;
                continue;
            }

            chunks.push(current.trim());
            current = piece.trimStart();
        }
    }

    if (current.trim().length > 0) {
        chunks.push(current.trim());
    }

    return chunks;
}

/**
 * Breaks a paragraph down until every returned piece fits into `limit`.
 */
function fitPieces(paragraph: string, limit: number): Array<string> {
    if (paragraph.length <= limit) {
        return [paragraph];
    }

    const pieces: Array<string> = [];
    for (const line of splitKeepingSeparator(paragraph, "\n")) {
        if (line.length <= limit) {
            pieces.push(line);
            continue;
        }

        for (const word of splitKeepingSeparator(line, " ")) {
            if (word.length <= limit) {
                pieces.push(word);
                continue;
            }

            pieces.push(...splitGraphemes(word, limit));
        }
    }

    return pieces;
}

/**
 * Splits on a separator while keeping it attached to the preceding piece so
 * rejoined chunks keep their original spacing.
 */
function splitKeepingSeparator(text: string, separator: string): Array<string> {
    const parts = text.split(separator);
    return parts.map((part, index) => (index < parts.length - 1 ? part + separator : part)).filter((p) => p.length > 0);
}

function splitGraphemes(text: string, limit: number): Array<string> {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    const chunks: Array<string> = [];
    let current = "";

    for (const { segment } of segmenter.segment(text)) {
        if (current.length + segment.length > limit) {
            chunks.push(current);
            current = "";
        }
        current += segment;
    }

    if (current.length > 0) {
        chunks.push(current);
    }

    return chunks;
}
