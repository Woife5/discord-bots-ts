import { openRouterKey } from "consants";
import { wait } from "wait";

type ChatCompletionResponse = { id: string; choices: Array<{ message: { role: "assistant"; content: string } }> };
type ChatCompletionErrorResponse = { error: { message: string; code: number } };
type Messages = Array<{ role: "user" | "assistant" | "system"; content: string }>;

function isErrorResponse(
    response: ChatCompletionErrorResponse | ChatCompletionResponse | undefined,
): response is ChatCompletionErrorResponse {
    return !!response && typeof response === "object" && "error" in response;
}

export async function getChatCompletion(input: Messages, retry: number = 0) {
    const url = "https://openrouter.ai/api/v1/chat/completions";
    const model = "openrouter/free";
    const body = {
        model,
        messages: input,
    };
    const options = {
        method: "POST",
        headers: { Authorization: `Bearer ${openRouterKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
    };

    try {
        const response = await fetch(url, options);
        const data = (await response.json()) as ChatCompletionResponse | ChatCompletionErrorResponse | undefined;
        if (!data || isErrorResponse(data)) {
            if (data?.error.code === 429) {
                console.warn(
                    "Rate limit exceeded for model",
                    model,
                    ":",
                    data.error.message,
                    `Retrying in 5 seconds... (${retry + 1})`,
                );
                if (retry < 5) {
                    await wait(5_000);
                    return getChatCompletion(input, retry + 1);
                }
            }

            throw new Error("No choices returned from OpenRouter");
        }
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Error getting completion from model", model, ":", error);
        if (retry < 5) {
            console.log(`Retrying... (${retry + 1})`);
            return getChatCompletion(input, retry + 1);
        }
    }
}
