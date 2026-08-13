import { minimumMessageCount } from "../constants";
import type { BufferedMessage } from "../database/message-buffer";
import { getNeutralSummary } from "../openrouter";
import type { SummaryResult } from "../summary-result";
import { renderTranscript } from "../transcript";

export type SummarizeOutcome =
    /** Fewer than the minimum number of live messages; no LLM call was made. */
    | { kind: "too-few" }
    /** The LLM ran successfully. `result.significant` decides if there is output. */
    | { kind: "summarized"; result: SummaryResult };

/**
 * Shared middle of every summary pipeline: minimum-size check, transcript
 * rendering and the LLM call. Callers own windowing, cursors and delivery.
 */
export async function summarizeMessages(messages: Array<BufferedMessage>): Promise<SummarizeOutcome> {
    const live = messages.filter((message) => !message.deleted);
    if (live.length < minimumMessageCount) {
        return { kind: "too-few" };
    }

    // Tombstones stay in the transcript so the summary can mention withdrawn
    // messages instead of silently misrepresenting the conversation.
    const result = await getNeutralSummary(renderTranscript(messages));
    return { kind: "summarized", result };
}

/** `createdAt` of the newest message in a window, used to advance cursors. */
export function newestMessageTime(messages: Array<BufferedMessage>): Date | undefined {
    let newest: Date | undefined;
    for (const message of messages) {
        if (!newest || message.createdAt > newest) {
            newest = message.createdAt;
        }
    }
    return newest;
}
