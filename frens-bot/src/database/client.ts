import { dbClient, mongoClient } from "./db";
import { createMessageBufferIndexes } from "./message-buffer";
import { createSubscriptionIndexes } from "./subscriptions";
import { createSummaryStateIndexes } from "./summary-state";

export { dbClient };

export async function connectToDatabase() {
    try {
        await mongoClient.connect();
        await createSubscriptionIndexes();
        await createSummaryStateIndexes();
        await createMessageBufferIndexes();
    } catch (e) {
        console.error("Failed to connect to MongoDB", e);
        await mongoClient.close();
        process.exit(1);
    }
}

export async function closeDatabase() {
    await mongoClient.close();
}
