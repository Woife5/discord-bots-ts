import { MongoClient } from "mongodb";
import { mongoUri } from "../constants";

/**
 * Client and database handles only. Kept free of any collection imports so
 * collection modules can import `dbClient` without creating a cycle back
 * through the connect logic.
 */
export const mongoClient = new MongoClient(mongoUri);
export const dbClient = mongoClient.db("frensBot");
