import { adminRoleId } from "@data";
import { Role } from "commands/command-interfaces";
import { Guild, GuildMember, User as DiscordUser } from "discord.js";
import { HydratedDocument } from "mongoose";
import { IUser, Powers, User } from "./db-helpers";

const userCache = new Map<string, HydratedDocument<IUser> | null>();

export async function getUserRole(user: DiscordUser, guild: Guild): Promise<Role> {
    if (user.id === process.env.WOLFGANG_ID) {
        return Role.OWNER;
    }

    const member = await guild.members.fetch(user.id);

    return getMemberRole(member);
}

export async function getMemberRole(member: GuildMember): Promise<Role> {
    if (member.user.id === process.env.WOLFGANG_ID) {
        return Role.OWNER;
    }

    if (member.permissions.has("ADMINISTRATOR") || member.roles.cache.has(adminRoleId)) {
        return Role.ADMIN;
    }

    return Role.USER;
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
