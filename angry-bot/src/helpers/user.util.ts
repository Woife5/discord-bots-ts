import { adminRoleId } from "@data";
import { Guild, GuildMember, User as DiscordUser } from "discord.js";
import type { HydratedDocument } from "mongoose";
import { Role } from "shared/lib/commands/types.d";
import { isToday } from "shared/lib/utils/date.util";
import { createUserSimple, IUser, Powers, User } from "./db-helpers";
import { adminId } from "./environment";

type UserActionCacheItem = {
    date: Date;
    emojiCash: number;
    feetCash: boolean;
    gambles: number;
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

    Object.keys(newValues).forEach(key => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        existingUser[key] = newValues[key];
    });

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

    if (member.permissions.has("Administrator") || member.roles.cache.has(adminRoleId)) {
        return Role.ADMIN;
    }

    return Role.USER;
}

/**
 * This function will NOT check if the user's balance will be below 0 after or before the action.
 */
export async function updateUserBalance(args: UserBalanceUpdateArgs): Promise<boolean> {
    const { userId, username = "unknown", amount, taxPayed } = args;

    let user = await getUser(userId);

    if (!user) {
        user = await createUserSimple(userId, username);
    }

    user.angryCoins += amount;
    username !== "unknown" && (user.userName = username);
    taxPayed && (user.lastTransaction = new Date());
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
        userName: user?.userName ?? "unknown",
        powers: {
            [power]: (user?.powers[power] ?? 0) + amount,
            ...user?.powers,
        },
        angryCoins: user?.angryCoins ?? 0,
    } satisfies Partial<IUser>;
}

export function updateUserActionCache(userId: string, update: Partial<UserActionCacheItem>) {
    const item = userActionsCache.get(userId);

    if (!item || !isToday(item.date)) {
        const newItem: UserActionCacheItem = {
            date: update.date ?? new Date(),
            emojiCash: update.emojiCash ?? 0,
            feetCash: update.feetCash ?? false,
            gambles: update.gambles ?? 0,
        };
        userActionsCache.set(userId, newItem);
        return;
    }

    item.emojiCash += update.emojiCash ?? 0;
    item.feetCash = update.feetCash ?? item.feetCash;
    item.gambles += update.gambles ?? 0;
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
