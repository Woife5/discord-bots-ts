import { isToday, Role } from "@woife5/shared";
import type { User as DiscordUser, Guild, GuildMember } from "discord.js";
import { adminId, clientId } from "helpers/env.util";
import type { HydratedDocument } from "mongoose";
import { createUserSimple, GuildSettingsCache, type IUser, type Powers, User, type UserStatKeys } from "./db-helpers";

type UserActionCacheItem = {
    date: Date;
    emojiCash: number;
    feetCash: boolean;
    gambles: number;
    catboys: number;
    advertisement: boolean;
};

export type UserBalanceUpdateArgs = {
    userId: string;
    username?: string;
    amount: number;
    taxPayed?: boolean;
};

const userCache = new Map<string, HydratedDocument<IUser> | null>();
const userActionsCache = new Map<string, UserActionCacheItem>();

export async function getUser(userId: string): Promise<HydratedDocument<IUser> | null> {
    if (userCache.has(userId)) {
        return userCache.get(userId) ?? null;
    }

    const user = await User.findOne({ userId });
    if (user) {
        userCache.set(userId, user);
    }

    return user;
}

export async function updateUser(userId: string, newValues: Partial<IUser>) {
    let existingUser = await getUser(userId);

    if (!existingUser) {
        existingUser = await createUserSimple(userId, newValues.userName ?? "unknown");
    }

    for (const key of Object.keys(newValues)) {
        // @ts-expect-error
        existingUser[key] = newValues[key];
    }

    const newUser = await existingUser.save();
    userCache.set(userId, newUser);
}

export function invalidateUserCache(userId: string) {
    userCache.delete(userId);
}

export async function getUserRole(user: DiscordUser, guild: Guild | null): Promise<Role> {
    if (user.id === adminId) {
        return Role.OWNER;
    }

    if (!guild) {
        return Role.USER;
    }

    const member = await guild.members.fetch(user.id);

    return getMemberRole(member);
}

export async function getMemberRole(member: GuildMember): Promise<Role> {
    if (member.user.id === adminId) {
        return Role.OWNER;
    }

    if (member.permissions.has("Administrator")) {
        return Role.ADMIN;
    }

    const guildSettings = await GuildSettingsCache.get(member.guild.id);
    if (guildSettings?.adminRoleId && member.roles.cache.has(guildSettings.adminRoleId)) {
        return Role.ADMIN;
    }

    return Role.USER;
}

/**
 * This function will NOT check if the user's balance will be below 0 after or before the action.
 */
export async function updateUserBalance(args: UserBalanceUpdateArgs): Promise<boolean> {
    const { userId, username, amount, taxPayed } = args;

    let user = await getUser(userId);

    if (!user) {
        user = await createUserSimple(userId, username ?? "unknown");
    }

    user.angryCoins += amount;
    if (username != null) {
        user.userName = username;
    }
    if (taxPayed) {
        user.lastTransaction = new Date();
    }
    await user.save();

    userCache.set(userId, user);

    return true;
}

export async function getUserBalance(userId: string): Promise<number> {
    const user = await getUser(userId);
    return user?.angryCoins ?? 0;
}

export async function hasPower(userId: string, power: Powers): Promise<boolean> {
    const user = await getUser(userId);

    if (!user || !user.powers[power] || user.powers[power] <= 0) {
        return false;
    }

    return true;
}

export async function getPowerUpdate(userId: string, power: Powers, amount: number) {
    const user = await getUser(userId);

    return {
        userId,
        userName: user?.userName,
        powers: {
            ...user?.powers,
            [power]: (user?.powers[power] ?? 0) + amount,
        },
        angryCoins: user?.angryCoins ?? 0,
    } satisfies Partial<IUser>;
}

/**
 * does not update values but overwrites them
 */
export function updateUserActionCache(userId: string, update: Partial<UserActionCacheItem>) {
    const item = userActionsCache.get(userId);

    if (!item || !isToday(item.date)) {
        const newItem: UserActionCacheItem = {
            date: update.date ?? new Date(),
            emojiCash: update.emojiCash ?? 0,
            feetCash: update.feetCash ?? false,
            gambles: update.gambles ?? 0,
            catboys: update.catboys ?? 0,
            advertisement: update.advertisement ?? false,
        };
        userActionsCache.set(userId, newItem);
        return;
    }

    item.emojiCash += update.emojiCash ?? 0;
    item.feetCash = update.feetCash ?? item.feetCash;
    item.gambles += update.gambles ?? 0;
    item.catboys += update.catboys ?? 0;
}

export function getUserActionCache(userId: string): UserActionCacheItem | undefined {
    const user = userActionsCache.get(userId);
    if (!user || !isToday(user.date)) {
        return undefined;
    }

    return user;
}

export function isUserPower(power: string): power is Powers {
    return power === "censorship-immunity";
}

const userStatKeys = new Set<UserStatKeys>([
    "bibleverses-requested",
    "catboys-requested",
    "catgirls-requested",
    "mc-luhans",
    "money-lost-in-gambling",
    "money-won-in-gambling",
    "tarots-read",
    "times-censored",
    "total-angry-stickers-sent",
    "yesno-questions",
]);
export function isUserStatKey(key: string): key is UserStatKeys {
    return userStatKeys.has(key as UserStatKeys);
}

export async function getTopByStat(stat: UserStatKeys) {
    const users = await User.find({ stats: { $exists: true } }).exec();
    return toSortedArray(users, (user) => user.stats[stat] ?? 0);
}

export async function getTopSpammers() {
    const users = await User.find({ emojis: { $exists: true } }).exec();
    return toSortedArray(users, (user) => {
        return Object.values(user.emojis).reduce((acc, cur) => acc + cur, 0);
    });
}

export async function getTopStickerSpammer() {
    const users = await User.find({ stickers: { $exists: true } }).exec();
    return toSortedArray(users, (user) => {
        return Object.values(user.stickers).reduce((acc, cur) => acc + cur, 0);
    });
}

export async function getTopMoneyHoarders() {
    const users = await User.find({ angryCoins: { $gt: 0 } }).exec();
    return toSortedArray(
        users.filter((user) => user.userId !== clientId),
        (user) => user.angryCoins,
    );
}

export type TopSpamResult = {
    userId: string;
    userName: string;
    spamCount: number;
};

function toSortedArray(
    users: HydratedDocument<IUser>[],
    mappingFn: (user: HydratedDocument<IUser>) => number,
): TopSpamResult[] {
    return users
        .map((user) => {
            return {
                userId: user.userId,
                userName: user.userName,
                spamCount: mappingFn(user),
            };
        })
        .filter((user) => user.spamCount > 0)
        .sort((a, b) => b.spamCount - a.spamCount);
}
