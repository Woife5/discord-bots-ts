/* eslint-disable @typescript-eslint/no-var-requires */
import { init as initDatabase, User, Stats, ConfigCache } from "@helpers";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}

interface ILegacyStats {
    "angry-reactions-by-bot": number;
    "angry-tarots-read": number;
    tarots: {
        [tarotId: string]: number;
    };
    users: {
        [uderId: string]: {
            name: string;
            emojis: {
                [emojiId: string]: number;
            };
            "emojis-sent"?: number;
            "tarots-requested"?: number;
            "messages-cencored"?: number;
            "yesno-questions-answered"?: number;
            "neekos-requested"?: number;
        };
    };
    emojis: {
        [emojiId: string]: number;
    };
    "angry-divotkey": number;
    "messages-cencored": number;
    "non-feet-messages-deleted": number;
    "yesno-questions-answered": number;
    mcluhan: number;
    "neekos-requested": number;
    "russia-sanctions": number;
}

interface ILegacyTarotCache {
    [userId: string]: {
        tarot: number;
        timestamp: number;
        streak: number;
    };
}

await initDatabase();

const angryStats: ILegacyStats = require("../../../angry-bot/stats-and-cache/angry-stats.json");
const censoredEmoji: string[] = require("../../../angry-bot/stats-and-cache/censored-emoji.json");
const tarotReminders: string[] = require("../../../angry-bot/stats-and-cache/tarot-reminders.json");
const angryTarotCache: ILegacyTarotCache = require("../../../angry-bot/stats-and-cache/angry-tarot-cache.json");
const googleCredentials = require("../../../angry-bot/config/credentials.json");
const googleTokens = require("../../../angry-bot/stats-and-cache/google-token.json");

Object.entries(angryStats.users).forEach(([id, user]) => {
    const reminder = tarotReminders.includes(id);
    const streak = angryTarotCache[id]?.streak ?? 0;

    User.create({
        userId: id,
        userName: user.name,
        tarotreminder: reminder,
        tarotStreak: streak,
        lastTarot: new Date(angryTarotCache[id]?.timestamp ?? 0),
        tarot: angryTarotCache[id]?.tarot ?? -1,
        stats: {
            "tarots-read": user["tarots-requested"] ?? 0,
            "total-angry-emojis-sent": user["emojis-sent"] ?? 0,
            "times-censored": 0,
            "yesno-questions": user["yesno-questions-answered"] ?? 0,
            "mc-luhans": 0,
            "catgirls-requested": user["neekos-requested"] ?? 0,
            "bibleverses-requested": 0,
        },
        emojis: user["emojis"] ?? {},
    });
});

Stats.create({
    key: "individual-tarots-read:any",
    anyValue: angryStats["tarots"],
});

Stats.create({
    key: "angry-reactions",
    value: angryStats["angry-reactions-by-bot"],
});

Stats.create({
    key: "tarots-read",
    value: angryStats["angry-tarots-read"],
});

Stats.create({
    key: "times-censored",
    value: angryStats["messages-cencored"],
});

Stats.create({
    key: "yesno-questions",
    value: angryStats["yesno-questions-answered"],
});

Stats.create({
    key: "mc-luhans",
    value: angryStats["mcluhan"],
});

Stats.create({
    key: "catgirls-requested",
    value: angryStats["neekos-requested"],
});

ConfigCache.set("censored", censoredEmoji);

ConfigCache.set("google-sheets-credentials", googleCredentials);

ConfigCache.set("google-sheets-tokens", googleTokens);

ConfigCache.set("feet-related", [
    "????",
    "????",
    "????",
    "????",
    "fu??",
    "feet",
    "fuss",
    "foot",
    "f??sse",
    "f????e",
    "leg",
    "bein",
]);
