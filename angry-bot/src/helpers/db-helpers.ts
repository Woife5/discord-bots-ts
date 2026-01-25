import { mongoUri } from "@woife5/shared/lib/utils/env.util";
import type { User as DiscordUser } from "discord.js";
import mongoose, { type HydratedDocument } from "mongoose";

const { Schema, connect, model } = mongoose;

export async function init() {
    mongoose.set("strictQuery", true);
    await connect(mongoUri);
}

export async function createUser(user: DiscordUser): Promise<HydratedDocument<IUser>> {
    return await createUserSimple(user.id, user.username);
}

export async function createUserSimple(id: string, name: string): Promise<HydratedDocument<IUser>> {
    return await User.create({
        userId: id,
        userName: name,
        emojis: {},
        stickers: {},
        stats: {},
        powers: {},
    });
}

// --------------------------------------------------------
// USER SCHEMA
// --------------------------------------------------------

export type Powers = "censorship-immunity";
export type UserStatKeys = Exclude<
    StatKeys,
    "individual-tarots-read:any" | "angry-reactions" | "total-angry-emojis-sent"
>;

export interface IUser {
    userId: string;
    userName: string;
    tarot: number;
    lastTarot: Date;
    tarotStreak: number;
    tarotreminder: boolean;
    stats: {
        [key in UserStatKeys]: number;
    };
    emojis: {
        [key: string]: number;
    };
    stickers: {
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
    stickers: {
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
// CENSORED SCHEMA
// --------------------------------------------------------

type Censored = {
    owner?: string;
    value: string;
    priceModifier: number;
};

const censoredSchema = new Schema<Censored>({
    owner: {
        type: String,
        required: false,
    },
    value: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
    },
    priceModifier: {
        type: Number,
        default: 1,
    },
});

const CensoredDB = model<Censored>("Censored", censoredSchema);

export class CensorshipUtil {
    private static _cache = new Map<string, Set<string>>();

    static async getAll(): Promise<Map<string, Set<string>>> {
        if (CensorshipUtil._cache.size === 0) {
            const censored = await CensoredDB.find({}).exec();
            CensorshipUtil._cache = new Map();

            for (const c of censored) {
                if (!c.owner) {
                    // No owner means this item is not currently censored.
                    continue;
                }
                const user = CensorshipUtil._cache.get(c.owner) || new Set();
                user.add(c.value);
                CensorshipUtil._cache.set(c.owner, user);
            }
        }

        return CensorshipUtil._cache;
    }

    /**
     * NOT cached
     * @returns a list of all censored values including their owners.
     */
    static async loadAll(): Promise<Censored[]> {
        const censored = await CensoredDB.find({}).exec();
        return censored.map((c) => {
            return {
                owner: c.owner,
                value: c.value,
                priceModifier: c.priceModifier,
            } satisfies Censored;
        });
    }

    /**
     * NOT cached
     * @returns null if the provided value is not censored, the owner of the value otherwise.
     */
    static async findOwner(value: string): Promise<string | null> {
        const censored = await CensoredDB.findOne({ value }).exec();
        if (!censored || !censored.owner) {
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
        return censored.map((c) => c.value);
    }

    static async isCensored(value: string): Promise<boolean> {
        const entry = await CensoredDB.findOne({ value }).exec();
        return !!entry && !!entry.owner;
    }

    /**
     * Adds a new censored string to the database and updated the cache.
     */
    static async add(censored: { owner: string; value: string }): Promise<Censored> {
        const value = censored.value.trim().toLowerCase();
        let found = await CensoredDB.findOne({ value }).exec();

        if (found) {
            found.owner = censored.owner;
            await found.save();
        } else {
            found = await CensoredDB.create({ owner: censored.owner, value });
        }

        const user = CensorshipUtil._cache.get(censored.owner) ?? new Set();
        user.add(value);
        CensorshipUtil._cache.set(censored.owner, user);

        return found;
    }

    /**
     * NOT cached
     * Loads the current price modifier for the provided value.
     */
    static async getPriceModifier(valueStr: string): Promise<number> {
        const value = valueStr.trim().toLowerCase();
        const item = await CensoredDB.findOne({ value }).exec();
        return item?.priceModifier ?? 1;
    }

    /**
     * Removes a censored string from the database and updates the cache.
     * Also makes the item more expensive to buy in the future.
     */
    static async remove(censored: string): Promise<void> {
        const value = censored.trim().toLowerCase();
        const found = await CensoredDB.findOne({ value }).exec();
        if (found) {
            found.owner = undefined;
            found.priceModifier += 1;
            await found.save();
        }

        for (const [owner, set] of CensorshipUtil._cache) {
            set.delete(value);
            CensorshipUtil._cache.set(owner, set);
        }
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
              | "total-angry-stickers-sent"
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
// GUILDSETTINGS SCHEMA
// --------------------------------------------------------

export interface IGuildSettings {
    guildId: string;
    broadcastChannelId: string;
    adminRoleId: string;
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
    adminRoleId: {
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
        const entry = GuildSettingsCache._cache.get(key);
        if (!entry || entry.expires < Date.now()) {
            const config = await GuildSettingsDB.findOne({ guildId: key }).exec();

            if (!config) {
                return null;
            }

            GuildSettingsCache._cache.set(key, {
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

        GuildSettingsCache._cache.set(guildId, {
            config: entry,
            expires: Date.now() + 999 * 60 * 10,
        });

        return await entry.save();
    }
}
