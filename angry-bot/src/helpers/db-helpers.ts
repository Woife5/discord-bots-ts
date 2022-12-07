import mongoose, { HydratedDocument } from "mongoose";
import { User as DiscordUser } from "discord.js";
const { Schema, connect, model } = mongoose;

export async function init() {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not defined.");
    }

    const uri = process.env.MONGO_URI;
    await connect(uri);
}

export async function createUser(user: DiscordUser): Promise<HydratedDocument<IUser>> {
    return await createUserSimple(user.id, user.username);
}

export async function createUserSimple(id: string, name: string): Promise<HydratedDocument<IUser>> {
    return await User.create({
        userId: id,
        userName: name,
        emojis: {},
        stats: {},
        powers: {},
    });
}

// --------------------------------------------------------
// USER SCHEMA
// --------------------------------------------------------

export type Powers = "censorship-immunity";
export type Service = "censorship-item" | "un-censorship-item";

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
        [key: string]: number;
    };
    angryCoins: number;
    lastTransaction: Date;
    powers: {
        [key in Powers]: number;
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
    angryCoins: {
        type: Number,
        default: 0,
    },
    lastTransaction: {
        type: Date,
        default: new Date(0),
    },
    powers: {
        type: Schema.Types.Mixed,
        default: {},
    },
});

export const User = model<IUser>("User", userSchema);

// --------------------------------------------------------
// CONFIG SCHEMA
// --------------------------------------------------------

type ConfigType = {
    key: "censored" | "feet-related";
    value: Map<string, string>;
};

type ConfigKeys = ConfigType["key"];

const configSchema = new Schema<ConfigType>({
    key: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    value: {
        type: Schema.Types.Map,
        required: true,
    },
});

const ConfigDB = model<ConfigType>("Config", configSchema);

type ConfigCacheEntry = {
    config: ConfigType;
    expires: number;
};

export class ConfigCache {
    private static _cache = new Map<ConfigKeys, ConfigCacheEntry>();

    static async get(key: ConfigKeys) {
        const entry = this._cache.get(key);
        if (!entry || entry.expires < Date.now()) {
            const config = await ConfigDB.findOne({ key }).exec();

            if (!config) {
                return null;
            }

            this._cache.set(key, {
                config: config,
                expires: Date.now() + 999 * 60 * 10,
            });

            return config.value;
        }

        return entry.config.value;
    }

    static async set(config: ConfigType) {
        this._cache.set(config.key, {
            config: config,
            expires: Date.now() + 999 * 60 * 10,
        });

        return await ConfigDB.updateOne(
            { key: config.key },
            { $set: { value: config.value } },
            { upsert: true }
        ).exec();
    }
}

// --------------------------------------------------------
// STATS SCHEMA
// --------------------------------------------------------

export type StatsType =
    | {
          key:
              | "angry-reactions"
              | "tarots-read"
              | "times-censored"
              | "yesno-questions"
              | "mc-luhans"
              | "catgirls-requested"
              | "catboys-requested"
              | "bibleverses-requested"
              | "total-angry-emojis-sent"
              | "money-lost-in-gambling"
              | "money-won-in-gambling";
          value: number;
      }
    | {
          key: "individual-tarots-read:any";
          anyValue: {
              [key: string]: number;
          };
      };

export type StatKeys = StatsType["key"];

const statsSchema = new Schema<StatsType>({
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

export const Stats = model<StatsType>("Stats", statsSchema);

export async function getStat(key: StatKeys) {
    const stat = await Stats.findOne({ key }).exec();
    if (!stat) {
        return 0;
    }

    if (stat.key === "individual-tarots-read:any") {
        return Object.values(stat.anyValue).reduce((a, b) => a + b, 0);
    }

    return stat.value;
}

// --------------------------------------------------------
// LOG SCHEMA
// --------------------------------------------------------

type LogType = "info" | "error" | "debug";

export class Log {
    constructor(private component: string = "Global") {}

    info(message: unknown, funcName = "") {
        Log.log("info", message, this.getComponentName(funcName));
    }

    debug(message: unknown, funcName = "") {
        Log.log("debug", message, this.getComponentName(funcName));
    }

    error(message: unknown, funcName = "") {
        Log.log("error", message, this.getComponentName(funcName));
    }

    private getComponentName(funcName: string) {
        return `${this.component}${funcName ? "." + funcName : ""}`;
    }

    private static async log(type: LogType, message: unknown, component: string) {
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

// --------------------------------------------------------
// GUILDSETTINGS SCHEMA
// --------------------------------------------------------

export interface IGuildSettings {
    guildId: string;
    broadcastChannelId: string;
}

const guildSettingsSchema = new Schema<IGuildSettings>({
    guildId: {
        type: String,
        required: true,
        unique: true,
    },
    broadcastChannelId: {
        type: String,
        required: false,
    },
});

const GuildSettingsDB = model<IGuildSettings>("GuildSettings", guildSettingsSchema);

type GuildSettingsCacheEntry = {
    config: IGuildSettings;
    expires: number;
};

export class GuildSettingsCache {
    private static _cache = new Map<string, GuildSettingsCacheEntry>();

    static async get(key: string): Promise<IGuildSettings | null> {
        const entry = this._cache.get(key);
        if (!entry || entry.expires < Date.now()) {
            const config = await GuildSettingsDB.findOne({ guildId: key }).exec();

            if (!config) {
                return null;
            }

            this._cache.set(key, {
                config: config,
                expires: Date.now() + 999 * 60 * 10,
            });

            return config;
        }

        return entry.config;
    }

    static async set(guildId: string, config: Partial<IGuildSettings>) {
        const entry = await GuildSettingsDB.findOne({ guildId: guildId }).exec();

        if (!entry) {
            return await GuildSettingsDB.create({
                guildId: guildId,
                ...config,
            });
        }

        if (config.broadcastChannelId) {
            entry.broadcastChannelId = config.broadcastChannelId;
        }

        this._cache.set(guildId, {
            config: entry,
            expires: Date.now() + 999 * 60 * 10,
        });

        return await entry.save();
    }
}
