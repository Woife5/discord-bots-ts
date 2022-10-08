import { adminRoleId } from "@data";
import { Role } from "commands/command-interfaces";
import { Guild, GuildMember, User as DiscordUser } from "discord.js";
import { HydratedDocument } from "mongoose";
import { createUserSimple, IUser, Powers, User } from "./db-helpers";

const userCache = new Map<string, HydratedDocument<IUser> | null>();

export type UserBalanceUpdateArgs = {
    userId: string;
    username?: string;
    amount: number;
    taxPayed?: boolean;
};

export function invalidateUserCache(userId: string) {
    userCache.delete(userId);
}

export async function getUserRole(user: DiscordUser, guild: Guild | null): Promise<Role> {
    if (user.id === process.env.WOLFGANG_ID) {
        return Role.OWNER;
    }

    if (!guild) {
        return Role.USER;
    }

    const member = await guild.members.fetch(user.id);

    return getMemberRole(member);
}

export async function getMemberRole(member: GuildMember): Promise<Role> {
    if (member.user.id === process.env.WOLFGANG_ID) {
        return Role.OWNER;
    }

    if (member.permissions.has("Administrator") || member.roles.cache.has(adminRoleId)) {
        return Role.ADMIN;
    }

    return Role.USER;
}

/**
 * This function will not check if the user's balance will be below 0 after or before the action.
 */
export async function updateUserBalance(args: UserBalanceUpdateArgs): Promise<boolean> {
    const { userId, username = "unknown", amount, taxPayed } = args;

    let user = await User.findOne({ userId: userId });

    if (!user) {
        user = await createUserSimple(userId, username);
    }

    user.angryCoins += amount;
    username !== "unknown" && (user.userName = username);
    taxPayed && (user.lastTransaction = new Date());
    await user.save();

    return true;
}

export async function getUserCurrency(userId: string): Promise<number> {
    const user = await User.findOne({ userId });

    return user?.angryCoins || 0;
}

export async function hasPower(userId: string, power: Powers): Promise<boolean> {
    let user;
    if (userCache.has(userId)) {
        user = userCache.get(userId);
    } else {
        user = await User.findOne({ userId });
        userCache.set(userId, user);
    }

    if (!user || !user.powers[power] || user.powers[power] <= 0) {
        return false;
    }

    return true;
}

export async function usePower(userId: string, power: Powers): Promise<boolean> {
    let user;
    if (userCache.has(userId)) {
        user = userCache.get(userId);
    } else {
        user = await User.findOne({ userId });
    }

    if (!user || !user.powers[power] || user.powers[power] <= 0) {
        return false;
    }

    user.powers[power] -= 1;
    user.markModified("powers");
    await user.save();
    userCache.set(userId, user);
    return true;
}
