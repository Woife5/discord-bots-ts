import mongoose from 'mongoose';
import { User as DiscordUser } from 'discord.js';
const { Schema, connect, model } = mongoose;

export async function init() {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not defined.');
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

export const User = model<IUser>('User', userSchema);

// --------------------------------------------------------
// CONFIG SCHEMA
// --------------------------------------------------------

type ConfigKeys = 'censored' | 'google-sheets-credentials' | 'google-sheets-tokens' | 'feet-related';

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

export const Config = model<IConfig>('Config', configSchema);

// --------------------------------------------------------
// STATS SCHEMA
// --------------------------------------------------------

export type StatKeys =
    | 'angry-reactions'
    | 'tarots-read'
    | 'individual-tarots-read:any'
    | 'total-angry-emojis-sent'
    | 'times-censored'
    | 'yesno-questions'
    | 'mc-luhans'
    | 'catgirls-requested'
    | 'bibleverses-requested';

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

export const Stats = model<IStats>('Stats', statsSchema);

// --------------------------------------------------------
// LOG SCHEMA
// --------------------------------------------------------

type LogType = 'info' | 'error' | 'debug';

export class log {
    static info(message: any, component: string) {
        this.log('info', message, component);
    }

    static debug(message: any, component: string) {
        this.log('debug', message, component);
    }

    static error(message: any, component: string) {
        this.log('error', message, component);
    }

    private static async log(type: LogType, message: any, component: string) {
        await Log.create({
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
        enum: ['info', 'error', 'debug'],
    },
});

export const Log = model<ILog>('Log', logSchema);
