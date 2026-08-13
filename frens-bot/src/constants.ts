const { CLIENT_ID, BOT_TOKEN, OPENROUTER_KEY, MONGO_URI, OPENROUTER_MODEL } = process.env;

if (!CLIENT_ID || !BOT_TOKEN || !OPENROUTER_KEY || !MONGO_URI) {
    console.error(
        "Please provide all of the following environment variables: CLIENT_ID, BOT_TOKEN, OPENROUTER_KEY, MONGO_URI",
    );
    process.exit(1);
}

export const clientId = CLIENT_ID;
export const token = BOT_TOKEN;
export const openRouterKey = OPENROUTER_KEY;
export const mongoUri = MONGO_URI;

/**
 * Model used for summaries. `openrouter/free` routes to whichever free model
 * is currently available, so pin an explicit id when the model size matters.
 */
export const openRouterModel = OPENROUTER_MODEL || "openrouter/free";

/** Parses a positive integer environment variable, falling back on absence or garbage. */
function positiveIntFromEnv(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) {
        return fallback;
    }

    const parsed = Number.parseInt(raw, 10);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        console.warn(`Ignoring invalid ${name}="${raw}", using default of ${fallback}`);
        return fallback;
    }

    return parsed;
}

/** Minimum number of live messages in a window before a summary is attempted. */
export const minimumMessageCount = positiveIntFromEnv("MINIMUM_MESSAGE_COUNT", 3);

/** Minutes a channel has to stay quiet before the DM pipeline summarizes it. */
export const inactivityTimeoutMs = positiveIntFromEnv("INACTIVITY_TIMEOUT_MINUTES", 60) * 60 * 1000;
