export type SummaryResult = { significant: false } | { significant: true; summary: string };

const NOTHING_MARKER = "NICHTS";
const SUMMARY_MARKER = "ZUSAMMENFASSUNG";

/**
 * Parses the marker-line protocol used by the summarizer prompt.
 *
 * The expected shape is either a single line `NICHTS` or a `ZUSAMMENFASSUNG`
 * line followed by the summary text. Small models drift, so the parser is
 * deliberately lenient: it strips markdown fences, tolerates punctuation and
 * casing differences, and falls back to treating an unmarked response as a
 * summary rather than discarding it.
 */
export function parseSummaryResponse(response: string | undefined | null): SummaryResult {
    const cleaned = stripCodeFence(response ?? "").trim();
    if (cleaned.length === 0) {
        return { significant: false };
    }

    const lines = cleaned.split("\n");
    const firstIndex = lines.findIndex((line) => line.trim().length > 0);
    if (firstIndex === -1) {
        return { significant: false };
    }

    const marker = normalizeMarker(lines[firstIndex] ?? "");
    const body = lines
        .slice(firstIndex + 1)
        .join("\n")
        .trim();

    if (marker === NOTHING_MARKER) {
        return { significant: false };
    }

    if (marker === SUMMARY_MARKER) {
        // A marker without any content means the model had nothing to say.
        return body.length > 0 ? { significant: true, summary: body } : { significant: false };
    }

    // No recognizable marker. Keep the response instead of dropping a summary
    // that is most likely still useful.
    return { significant: true, summary: cleaned };
}

/**
 * Removes a surrounding markdown code fence, which small models like to add
 * even when the prompt asks for plain text.
 */
function stripCodeFence(text: string): string {
    const trimmed = text.trim();
    if (!trimmed.startsWith("```")) {
        return trimmed;
    }

    const withoutStart = trimmed.replace(/^```[^\n]*\n?/, "");
    return withoutStart.replace(/\n?```$/, "");
}

function normalizeMarker(line: string): string {
    return line
        .trim()
        .replace(/^[*_#\s>-]+/, "")
        .replace(/[*_#\s:.!-]+$/, "")
        .toUpperCase();
}
