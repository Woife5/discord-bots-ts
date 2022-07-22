import mongoose from "mongoose";
import { User as DiscordUser } from "discord.js";
const { Schema, connect, model } = mongoose;

export async function init() {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not defined.");
    }

    const uri = process.env.MONGO_URI;
    await connect(uri);
}

export async function createUser(user: DiscordUser) {
    return await User.create({
        userId: user.id,
        userName: user.username,
    });
}

// --------------------------------------------------------
// USER SCHEMA
// --------------------------------------------------------

export interface IUser {
    userId: string;
    userName: string;
    tarot: number;
    lastTarot: Date;
    tarotStreak: number;
    tarotreminder: boolean;
    stats: {
        [key in StatKeys]: number;
    };
    emojis: {
        [key: number]: number;
    };
}

const userSchema = new Schema<IUser>({
    userId: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
    tarot: {
        type: Number,
        default: -1,
    },
    lastTarot: {
        type: Date,
        default: new Date(0),
    },
    tarotStreak: {
        type: Number,
        default: 0,
    },
    tarotreminder: {
        type: Boolean,
        default: false,
    },
    stats: {
        type: Schema.Types.Mixed,
        default: {},
    },
    emojis: {
        type: Schema.Types.Mixed,
        default: {},
    },
});

export const User = model<IUser>("User", userSchema);

// --------------------------------------------------------
// CONFIG SCHEMA
// --------------------------------------------------------

type ConfigKeys = "censored" | "google-sheets-credentials" | "google-sheets-tokens" | "feet-related";

export interface IConfig {
    key: ConfigKeys;
    value: any;
}

const configSchema = new Schema<IConfig>({
    key: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    value: {
        type: Schema.Types.Mixed,
        required: true,
    },
});

const ConfigDB = model<IConfig>("Config", configSchema);

type Cache = {
    [key: string]: {
        value: any;
        expires: number;
    };
};

export class ConfigCache {
    private static _cache = {} as Cache;

    static async get(key: string): Promise<any> {
        if (!(key in this._cache) || this._cache[key].expires < Date.now()) {
            const config = await ConfigDB.findOne({ key }).exec();

            if (!config) {
                return null;
            }

            this._cache[key] = {
                value: config.value,
                expires: Date.now() + 999 * 60 * 10,
            };
        }

        return this._cache[key].value;
    }

    static async set(key: ConfigKeys, value: any) {
        delete this._cache[key];
        return await ConfigDB.updateOne({ key: key }, { $set: { value: value } }, { upsert: true }).exec();
    }
}

// --------------------------------------------------------
// STATS SCHEMA
// --------------------------------------------------------

export type StatKeys =
    | "angry-reactions"
    | "tarots-read"
    | "individual-tarots-read:any"
    | "total-angry-emojis-sent"
    | "times-censored"
    | "yesno-questions"
    | "mc-luhans"
    | "catgirls-requested"
    | "bibleverses-requested";

export interface IStats {
    key: StatKeys;
    value: number;
    anyValue?: any;
}

const statsSchema = new Schema<IStats>({
    key: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    value: {
        type: Number,
        default: 0,
    },
    anyValue: {
        type: Schema.Types.Mixed,
        required: false,
    },
});

export const Stats = model<IStats>("Stats", statsSchema);

// --------------------------------------------------------
// LOG SCHEMA
// --------------------------------------------------------

type LogType = "info" | "error" | "debug";

export class Log {
    constructor(private component: string = "Global") {}

    info(message: any, funcName = "") {
        Log.log("info", message, this.getComponentName(funcName));
    }

    debug(message: any, funcName = "") {
        Log.log("debug", message, this.getComponentName(funcName));
    }

    error(message: any, funcName = "") {
        Log.log("error", message, this.getComponentName(funcName));
    }

    private getComponentName(funcName: string) {
        return `${this.component}${funcName ? "." + funcName : ""}`;
    }

    private static async log(type: LogType, message: any, component: string) {
        await LogDB.create({
            timestamp: Date.now(),
            message: JSON.stringify(message),
            type,
            component,
        });
    }
}

export interface ILog {
    timestamp: Date;
    message: string;
    component?: string;
    type: LogType;
}

const logSchema = new Schema<ILog>({
    timestamp: {
        type: Date,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    component: {
        type: String,
        required: false,
    },
    type: {
        type: String,
        required: true,
        enum: ["info", "error", "debug"],
    },
});

export const LogDB = model<ILog>("Log", logSchema);
