import { openRouterKey, openRouterModel } from "./constants";
import summarizeNeutral from "./prompts/summarize-neutral.txt";
import { parseSummaryResponse, type SummaryResult } from "./summary-result";

type ChatCompletionResponse = { id: string; choices: Array<{ message: { role: "assistant"; content: string } }> };
type ChatCompletionErrorResponse = { error: { message: string; code: number } };
type Messages = Array<{ role: "user" | "assistant" | "system"; content: string }>;

const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 2_000;
const MAX_BACKOFF_MS = 60_000;

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isErrorResponse(
    response: ChatCompletionErrorResponse | ChatCompletionResponse | undefined,
): response is ChatCompletionErrorResponse {
    return !!response && typeof response === "object" && "error" in response;
}

/**
 * Exponential backoff with full jitter, capped at MAX_BACKOFF_MS.
 */
function backoffDelay(attempt: number): number {
    const exponential = Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS);
    return Math.round(exponential / 2 + Math.random() * (exponential / 2));
}

/**
 * `Retry-After` is either a delay in seconds or an HTTP date.
 */
function parseRetryAfter(header: string | null): number | undefined {
    if (!header) {
        return undefined;
    }

    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0) {
        return Math.min(seconds * 1000, MAX_BACKOFF_MS);
    }

    const date = Date.parse(header);
    if (!Number.isNaN(date)) {
        return Math.min(Math.max(date - Date.now(), 0), MAX_BACKOFF_MS);
    }

    return undefined;
}

export async function getNeutralSummary(transcript: string): Promise<SummaryResult> {
    const history: Messages = [
        { role: "system", content: summarizeNeutral },
        { role: "user", content: `<transkript>\n${transcript}\n</transkript>` },
    ];

    const response = await getChatCompletion(history);
    return parseSummaryResponse(response);
}

async function getChatCompletion(input: Messages): Promise<string> {
    const url = "https://openrouter.ai/api/v1/chat/completions";
    const options = {
        method: "POST",
        headers: { Authorization: `Bearer ${openRouterKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: openRouterModel, messages: input }),
    };

    let lastError: unknown = new Error("No completion returned from OpenRouter");

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
            await wait(backoffDelay(attempt - 1));
        }

        try {
            const response = await fetch(url, options);
            const data = (await response.json()) as ChatCompletionResponse | ChatCompletionErrorResponse | undefined;

            if (!data || isErrorResponse(data)) {
                const code = data?.error.code ?? response.status;
                lastError = new Error(`OpenRouter error ${code}: ${data?.error.message ?? "unknown error"}`);

                if (code === 429) {
                    const retryAfter = parseRetryAfter(response.headers.get("retry-after"));
                    console.warn(
                        `Rate limited by OpenRouter (${openRouterModel}), attempt ${attempt + 1}/${MAX_RETRIES + 1}`,
                    );
                    if (retryAfter !== undefined && attempt < MAX_RETRIES) {
                        await wait(retryAfter);
                    }
                    continue;
                }

                // 4xx other than 429 will not resolve by retrying.
                if (code >= 400 && code < 500) {
                    throw lastError;
                }

                continue;
            }

            const content = data.choices[0]?.message.content;
            if (!content) {
                lastError = new Error("OpenRouter returned no choices");
                continue;
            }

            return content;
        } catch (error) {
            lastError = error;
            console.error(`OpenRouter request failed (attempt ${attempt + 1}/${MAX_RETRIES + 1})`, error);

            // Do not keep retrying a request the server rejected outright.
            if (error instanceof Error && error.message.startsWith("OpenRouter error 4")) {
                throw error;
            }
        }
    }

    throw lastError;
}
