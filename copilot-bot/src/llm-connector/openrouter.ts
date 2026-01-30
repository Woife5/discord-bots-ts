import { openRouterKey } from "consants";
import { wait } from "wait";

type ModelsResponse = {
    data: Array<{ id: string }>;
};

const modelBlacklist = new Set<string>([
    "google/gemma-3-4b-it:free",
    "google/gemma-3-4b-it:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "moonshotai/kimi-k2:free",
    "openai/gpt-oss-20b:free",
    "openai/gpt-oss-120b:free",
    "google/gemma-3n-e4b-it:free",
    "google/gemma-3-12b-it:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-3-27b-it:free",
    "google/gemma-3n-e2b-it:free",
]);

const modelCache = {
    models: [] as string[],
    lastFetched: 0,
};

export function blacklistModel(modelId: string) {
    modelBlacklist.add(modelId);
}

export function getBlacklistedModels() {
    return Array.from(modelBlacklist);
}

/** 24 hours in milliseconds for cache age */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function getFreeModels() {
    if (Date.now() - modelCache.lastFetched < ONE_DAY_MS) {
        modelCache.models = modelCache.models.filter((model) => !modelBlacklist.has(model));
        return modelCache.models;
    }
    const response = await fetch("https://openrouter.ai/api/v1/models", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${openRouterKey}`,
        },
    });
    const body = (await response.json()) as ModelsResponse;
    const freeModels = body.data
        .filter((model) => model.id.endsWith("free"))
        .filter((model) => !modelBlacklist.has(model.id))
        .map((model) => model.id);
    modelCache.models = freeModels;
    modelCache.lastFetched = Date.now();
    return freeModels;
}

export async function getRandomFreeModel() {
    const models = await getFreeModels();
    if (models.length === 0) {
        throw new Error("No free models available");
    }
    const randomIndex = Math.floor(Math.random() * models.length);
    return models[randomIndex];
}

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
    const model = await getRandomFreeModel();
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
                    `Retrying in 10 seconds... (${retry + 1})`,
                );
                if (retry < 5) {
                    await wait(10_000);
                    return getChatCompletion(input, retry + 1);
                }
            }

            // All other errors except rate limit, we blacklist the model.
            console.error(data);
            blacklistModel(model);
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
