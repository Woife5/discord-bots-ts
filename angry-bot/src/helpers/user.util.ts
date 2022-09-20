import { adminRoleId } from "@data";
import { Role } from "commands/command-interfaces";
import { Guild, GuildMember, User as DiscordUser } from "discord.js";
import { User } from "./db-helpers";

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
