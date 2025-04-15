import { mongoUri } from "@woife5/shared/lib/utils/env.util";
import { MongoClient } from "mongodb";

const client = new MongoClient(mongoUri);

try {
    await client.connect();
} catch (e) {
    console.error("Failed to connect to MongoDB", e);
    client.close();
    process.exit(1);
}

const db = client.db("bollerBot");
export const config = db.collection("config");
