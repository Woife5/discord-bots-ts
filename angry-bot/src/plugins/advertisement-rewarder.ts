import { cleanContains, type PluginReturnCode } from "@woife5/shared";
import type { Message } from "discord.js";
import { getUserActionCache, updateUserActionCache, updateUserBalance } from "helpers/user.util";

const sponsors = new Set(["lockheed martin", "rheinmetall", "marlboro"]);

export async function apply(message: Message): Promise<PluginReturnCode> {
    const userActions = getUserActionCache(message.author.id);
    if (userActions?.advertisement) {
        return "CONTINUE";
    }

    for (const sponsor of sponsors) {
        if (cleanContains(message, sponsor)) {
            await updateUserBalance({ userId: message.author.id, amount: 10, username: message.author.username });
            updateUserActionCache(message.author.id, { advertisement: true });
        }
    }

    return "CONTINUE";
}
