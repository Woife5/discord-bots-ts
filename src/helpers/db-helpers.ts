import mongoose from 'mongoose';
import { User as DiscordUser } from 'discord.js';
const { Schema, connect, model } = mongoose;

export class DatabaseUtils {
    static init() {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined.');
        }

        const uri = process.env.MONGO_URI;
        connect(uri);
    }

    static createUser(user: DiscordUser) {
        return User.create({
            userId: user.id,
            userName: user.username,
        });
    }
}

// --------------------------------------------------------
// USER SCHEMA
// --------------------------------------------------------

export interface User {
    userId: string;
    userName: string;
    tarot: number;
    lastTarot: Date;
    tarotStreak: number;
    tarotreminder: boolean;
    stats: {
        [key: string]: number;
    };
}

const userSchema = new Schema<User>({
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
});

export const User = model<User>('User', userSchema);

// --------------------------------------------------------
// CONFIG SCHEMA
// --------------------------------------------------------

export interface Config {
    key: string;
    value: any;
}

const configSchema = new Schema<Config>({
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

export const Config = model<Config>('Config', configSchema);

// --------------------------------------------------------
// STATS SCHEMA
// --------------------------------------------------------

export type StatKeys =
    | 'angry-reactions'
    | 'tarots-read'
    | 'total-angry-emojis-sent'
    | 'times-censored'
    | 'yesno-questions'
    | 'mc-luhans'
    | 'catgirls-requested'
    | 'bibleverses-requested';

export interface Stats {
    key: StatKeys;
    value: number;
}

const statsSchema = new Schema<Stats>({
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
});

export const Stats = model<Stats>('Stats', statsSchema);
