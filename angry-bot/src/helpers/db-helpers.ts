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
export type ShopItems = "censorship" | "un-censorship";

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
// CONFIG SCHEMA - no longer used
// --------------------------------------------------------

/**
 * @deprecated
 */
type ConfigType = {
    key: "censored" | "feet-related";
    value: Map<string, string>;
};

/**
 * @deprecated
 */
type ConfigKeys = ConfigType["key"];

/**
 * @deprecated
 */
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

/**
 * @deprecated
 */
const ConfigDB = model<ConfigType>("Config", configSchema);

/**
 * @deprecated
 */
type ConfigCacheEntry = {
    config: ConfigType;
    expires: number;
};

/**
 * @deprecated
 */
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
// CENSORED SCHEMA
// --------------------------------------------------------

type Censored = {
    owner: string;
    value: string;
};

const censoredSchema = new Schema<Censored>({
    owner: {
        type: String,
        required: true,
    },
    value: {
        type: String,
        required: true,
        lowercase: true,
    },
});

const CensoredDB = model<Censored>("Censored", censoredSchema);

export class CensorshipUtil {
    private static _cache = new Set<string>();

    static async getAll(): Promise<Set<string>> {
        if (this._cache.size === 0) {
            const censored = await CensoredDB.find({}).exec();
            this._cache = new Set(censored.map(c => c.value));
        }

        return this._cache;
    }

    /**
     * NOT cached
     * @returns null if the provided value is not censored, the owner of the value otherwise.
     */
    static async findOwner(value: string): Promise<string | null> {
        const censored = await CensoredDB.findOne({ value }).exec();
        if (!censored) {
            return null;
        }

        return censored.owner;
    }

    /**
     * NOT cached
     * @returns an array containing all string censored by the provided user.
     */
    static async findCensored(owner: string): Promise<string[]> {
        const censored = await CensoredDB.find({ owner }).exec();
        return censored.map(c => c.value);
    }

    static async isCensored(value: string): Promise<boolean> {
        return (await this.getAll()).has(value.trim().toLowerCase());
    }

    /**
     * Adds a new censored string to the database and updated the cache.
     */
    static async add(censored: Censored): Promise<Censored> {
        const value = censored.value.trim().toLowerCase();
        this._cache.add(value);
        return await CensoredDB.create({ owner: censored.owner, value });
    }

    /**
     * Removes a censored string from the database and updates the cache.
     */
    static async remove(censored: string): Promise<void> {
        const value = censored.trim().toLowerCase();
        this._cache.delete(value);
        await CensoredDB.deleteOne({ value }).exec();
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
