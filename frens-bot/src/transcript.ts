import type { BufferedMessage } from "./database/message-buffer";
import type { MediaItem, MessageContext } from "./extract";

/**
 * Renders the buffer as a transcript.
 *
 * The notation is deliberately self-documenting so the prompt does not have
 * to explain it, which matters for the small models this bot targets:
 *
 *   alice: schaut euch das an
 *   bob (antwortet auf alice "schaut euch das an"): passt
 *   carol: [Bild: plan.png, Beschreibung: Fahrplan]
 *   dave: [weitergeleitet] wir treffen uns um 9
 *   erin: [gelöschte Nachricht]
 */
export function renderTranscript(messages: Array<BufferedMessage>): string {
    return messages.map(renderMessage).join("\n");
}

function renderMessage(message: BufferedMessage): string {
    if (message.deleted) {
        return `${message.author}: [gelöschte Nachricht]`;
    }

    const context = message.context;
    if (!context) {
        // Messages buffered before the rich context existed.
        return `${message.author}: ${message.content}`;
    }

    const parts: Array<string> = [];

    if (context.forward) {
        parts.push("[weitergeleitet]");
        if (context.forward.content) {
            parts.push(context.forward.content);
        }
        for (const media of context.forward.media) {
            parts.push(`[${media}]`);
        }
    }

    const content = context.content.trim();
    if (content.length > 0) {
        parts.push(content);
    }

    for (const item of context.media) {
        parts.push(renderMedia(item));
    }

    for (const link of context.links) {
        parts.push(renderLink(link.title, link.description));
    }

    if (context.poll) {
        const answers = context.poll.answers.map((answer) => `${answer.text}: ${answer.votes}`).join(", ");
        parts.push(`[Umfrage: ${context.poll.question} — ${answers}]`);
    }

    if (context.reactions.length > 0) {
        const reactions = context.reactions.map((reaction) => `${reaction.emoji} ${reaction.count}`).join(", ");
        parts.push(`[Reaktionen: ${reactions}]`);
    }

    const body = parts.join(" ").trim();
    return `${message.author}${renderReply(context)}: ${body.length > 0 ? body : "[leere Nachricht]"}`;
}

function renderReply(context: MessageContext): string {
    const reply = context.reply;
    if (!reply) {
        return "";
    }

    if (reply.author && reply.excerpt) {
        return ` (antwortet auf ${reply.author} "${reply.excerpt}")`;
    }
    if (reply.author) {
        return ` (antwortet auf ${reply.author})`;
    }
    return " (antwortet auf eine frühere Nachricht)";
}

function renderMedia(item: MediaItem): string {
    const label = mediaLabel(item);
    const details: Array<string> = [];

    if (item.spoiler) {
        details.push("Spoiler");
    }
    if (item.description) {
        details.push(`Beschreibung: ${item.description}`);
    }

    const suffix = details.length > 0 ? `, ${details.join(", ")}` : "";
    return `[${label}${suffix}]`;
}

function mediaLabel(item: MediaItem): string {
    switch (item.kind) {
        case "image":
            return `Bild: ${item.label}`;
        case "gif":
            return `GIF: ${item.label}`;
        case "video":
            return `Video: ${item.label}`;
        case "audio":
            return `Audio: ${item.label}`;
        case "sticker":
            return `Sticker: ${item.label}`;
        default:
            return `Datei: ${item.label}`;
    }
}

function renderLink(title: string | undefined, description: string | undefined): string {
    const text = [title, description].filter((part) => part && part.length > 0).join(" — ");
    return `[Link: ${text}]`;
}
