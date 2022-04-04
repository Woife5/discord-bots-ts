import mongoose from 'mongoose';
const { Schema, connect, model } = mongoose;

export class DatabaseUtils {
    static init() {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined.');
        }

        const uri = process.env.MONGO_URI;
        connect(uri);
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
}

const userSchema = new Schema<User>({
    userId: {
        type: String,
        required: true,
    },
    userName: String,
    tarot: Number,
    lastTarot: Date,
    tarotStreak: Number,
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
