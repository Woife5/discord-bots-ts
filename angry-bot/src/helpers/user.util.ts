import { adminRoleId } from "@data";
import { Role } from "commands/command-interfaces";
import { Guild, GuildMember, User } from "discord.js";

export async function getUserRole(user: User, guild: Guild): Promise<Role> {
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
