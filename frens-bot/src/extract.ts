import {
    type Attachment,
    type Embed,
    type Message,
    MessageReferenceType,
    MessageType,
    type OmitPartialGroupDMChannel,
    type Snowflake,
} from "discord.js";

export type GuildMessage = OmitPartialGroupDMChannel<Message<true>>;

/** A message quoted by a reply, captured at ingest time. */
export type ReplyContext = {
    messageId: Snowflake;
    author?: string;
    /** Shortened excerpt, enough to identify what is being replied to. */
    excerpt?: string;
};

/** A forwarded message. Discord does not include the original author. */
export type ForwardContext = {
    content?: string;
    /** Rendered media of the forwarded message, e.g. "Bild: plan.png". */
    media: Array<string>;
};

export type MediaItem = {
    kind: "image" | "video" | "audio" | "file" | "gif" | "sticker";
    /** File name, GIF description or sticker name. */
    label: string;
    /** Alt text the author supplied. */
    description?: string;
    spoiler?: boolean;
    /** Pixel dimensions, when Discord reported them. */
    width?: number;
    height?: number;
};

export type LinkPreview = {
    url?: string;
    title?: string;
    description?: string;
};

export type PollContext = {
    question: string;
    answers: Array<{ text: string; votes: number }>;
};

export type ReactionSummary = {
    emoji: string;
    count: number;
};

/**
 * Everything worth summarizing about a single message.
 */
export type MessageContext = {
    content: string;
    reply?: ReplyContext;
    forward?: ForwardContext;
    media: Array<MediaItem>;
    links: Array<LinkPreview>;
    poll?: PollContext;
    reactions: Array<ReactionSummary>;
};

const EXCERPT_LENGTH = 120;
const MAX_LINK_PREVIEWS = 3;
const MAX_REACTIONS = 5;

/**
 * Builds the rich context for a message. `resolveReply` is provided by the
 * caller so an already buffered message can answer a reply lookup without an
 * extra API call.
 */
export async function extractContext(
    message: GuildMessage,
    resolveReply?: (messageId: Snowflake) => Promise<ReplyContext | undefined>,
): Promise<MessageContext> {
    const embeds = message.embeds;

    return {
        content: message.cleanContent,
        ...(await extractReply(message, resolveReply)),
        ...extractForward(message),
        media: [...extractAttachments(message), ...extractGifs(embeds), ...extractStickers(message)],
        links: extractLinks(embeds),
        ...extractPoll(message),
        reactions: extractReactions(message),
    };
}

async function extractReply(
    message: GuildMessage,
    resolveReply?: (messageId: Snowflake) => Promise<ReplyContext | undefined>,
): Promise<{ reply?: ReplyContext }> {
    // A non-null reference is not enough: forwards, crossposts, pins and
    // thread starters carry one as well.
    const isReply = message.type === MessageType.Reply && message.reference?.type === MessageReferenceType.Default;
    const messageId = message.reference?.messageId;

    if (!isReply || !messageId) {
        return {};
    }

    const resolved = await resolveReply?.(messageId);
    if (resolved) {
        return { reply: resolved };
    }

    try {
        const referenced = await message.fetchReference();
        return {
            reply: {
                messageId,
                author: referenced.author.displayName,
                ...excerptOf(referenced.cleanContent),
            },
        };
    } catch {
        // The referenced message was deleted or is not accessible. The edge
        // itself is still useful context.
        return { reply: { messageId } };
    }
}

function extractForward(message: GuildMessage): { forward?: ForwardContext } {
    if (message.reference?.type !== MessageReferenceType.Forward) {
        return {};
    }

    const snapshot = message.messageSnapshots.first();
    if (!snapshot) {
        return { forward: { media: [] } };
    }

    const media = [
        ...snapshot.attachments.values().map((attachment) => describeAttachment(attachment)),
        ...extractGifs([...snapshot.embeds]).map((item) => `GIF: ${item.label}`),
    ];

    const content = snapshot.content?.trim();

    return {
        forward: {
            ...(content ? { content } : {}),
            media,
        },
    };
}

function extractAttachments(message: GuildMessage): Array<MediaItem> {
    return [...message.attachments.values()].map((attachment) => {
        const kind = attachmentKind(attachment);

        return {
            kind,
            label: attachment.name,
            ...(attachment.description ? { description: attachment.description } : {}),
            ...(attachment.spoiler ? { spoiler: true } : {}),
            ...(attachment.width ? { width: attachment.width } : {}),
            ...(attachment.height ? { height: attachment.height } : {}),
        };
    });
}

function attachmentKind(attachment: Attachment): MediaItem["kind"] {
    const contentType = attachment.contentType ?? "";

    if (contentType.startsWith("image/")) {
        return contentType === "image/gif" ? "gif" : "image";
    }
    if (contentType.startsWith("video/")) {
        return "video";
    }
    if (contentType.startsWith("audio/")) {
        return "audio";
    }
    return "file";
}

/**
 * GIFs picked through Discord's GIF selector are not attachments. They arrive
 * as a "gifv" embed, sometimes only on a later messageUpdate.
 */
function extractGifs(embeds: Array<Embed>): Array<MediaItem> {
    const items: Array<MediaItem> = [];

    for (const embed of embeds) {
        if (embed.data.type !== "gifv") {
            continue;
        }

        items.push({
            kind: "gif",
            // gifv embeds carry no title or description, so the URL slug is
            // the only human readable hint about the content.
            label: gifLabel(embed) ?? "unbekannt",
        });
    }

    return items;
}

/**
 * Derives a label from a GIF share URL, e.g.
 * `tenor.com/view/confused-travolta-gif-12345` becomes "confused travolta".
 */
function gifLabel(embed: Embed): string | undefined {
    const url = embed.url ?? embed.data.url;
    if (!url) {
        return undefined;
    }

    try {
        const slug = new URL(url).pathname.split("/").filter(Boolean).pop();
        if (!slug) {
            return undefined;
        }

        const words = slug.split("-").filter(isDescriptiveWord).join(" ");
        return words.length > 0 ? truncate(words, EXCERPT_LENGTH) : undefined;
    } catch {
        return undefined;
    }
}

/**
 * Drops the parts of a GIF slug that carry no meaning: the literal "gif"
 * marker and the trailing id, which Tenor writes as digits and Giphy as a
 * mixed-case token.
 */
function isDescriptiveWord(word: string): boolean {
    if (word.length === 0 || word.toLowerCase() === "gif") {
        return false;
    }

    // Purely numeric, or long and mixed-case like "l0MYyxNVBBiHOJPzO".
    return !/^\d+$/.test(word) && !(word.length > 8 && /[A-Z]/.test(word) && /[a-z]/.test(word));
}

function extractStickers(message: GuildMessage): Array<MediaItem> {
    return [...message.stickers.values()].map((sticker) => ({
        kind: "sticker" as const,
        label: sticker.name,
        ...(sticker.description ? { description: sticker.description } : {}),
    }));
}

function extractLinks(embeds: Array<Embed>): Array<LinkPreview> {
    const previews: Array<LinkPreview> = [];

    for (const embed of embeds) {
        if (embed.data.type === "gifv" || embed.data.type === "image") {
            continue;
        }

        const url = embed.url ?? undefined;
        const title = embed.title ?? undefined;
        const description = embed.description ?? undefined;

        // An embed without any text adds nothing to a summary.
        if (!title && !description) {
            continue;
        }

        previews.push({
            ...(url ? { url } : {}),
            ...(title ? { title } : {}),
            ...(description ? { description: truncate(description, EXCERPT_LENGTH) } : {}),
        });

        if (previews.length >= MAX_LINK_PREVIEWS) {
            break;
        }
    }

    return previews;
}

function extractPoll(message: GuildMessage): { poll?: PollContext } {
    const poll = message.poll;
    if (!poll) {
        return {};
    }

    return {
        poll: {
            question: poll.question.text ?? "",
            answers: [...poll.answers.values()].map((answer) => ({
                text: answer.text ?? "",
                votes: answer.voteCount,
            })),
        },
    };
}

/**
 * Reaction counts are a cheap signal for which messages mattered. Aggregate
 * counts arrive with the message itself, no extra request needed.
 */
function extractReactions(message: GuildMessage): Array<ReactionSummary> {
    return [...message.reactions.cache.values()]
        .map((reaction) => ({ emoji: reaction.emoji.name ?? "?", count: reaction.count }))
        .filter((reaction) => reaction.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, MAX_REACTIONS);
}

function describeAttachment(attachment: Attachment): string {
    const contentType = attachment.contentType ?? "";
    const kind = contentType.startsWith("image/") ? "Bild" : "Datei";
    return `${kind}: ${attachment.name}`;
}

function excerptOf(content: string): { excerpt?: string } {
    const trimmed = content.trim().replace(/\s+/g, " ");
    return trimmed.length > 0 ? { excerpt: truncate(trimmed, EXCERPT_LENGTH) } : {};
}

function truncate(text: string, limit: number): string {
    const trimmed = text.trim().replace(/\s+/g, " ");
    return trimmed.length <= limit ? trimmed : `${trimmed.slice(0, limit - 1).trimEnd()}…`;
}
