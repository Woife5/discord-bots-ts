/* eslint-disable no-console */
import dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}

const { CLIENT_ID, BOT_TOKEN, WOLFGANG_ID, MONGO_URI } = process.env;

if (!CLIENT_ID || !BOT_TOKEN || !WOLFGANG_ID || !MONGO_URI) {
    console.error(
        "Please provide all of the following environment variables: CLIENT_ID, BOT_TOKEN, WOLFGANG_ID, MONGO_URI"
    );
    process.exit(1);
}

export const clientId = CLIENT_ID;
export const token = BOT_TOKEN;
export const adminId = WOLFGANG_ID;
export const mongoUri = MONGO_URI;
