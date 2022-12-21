import { Message } from "discord.js";
import { Stats } from "@helpers";
import type { PluginReturnCode } from "shared/lib/messages/message-wrapper";
import { getUser, getUserActionCache, updateUser, updateUserActionCache, updateUserBalance } from "helpers/user.util";
import { deepCopy } from "shared/lib/utils/object.util";

export async function count(message: Message): Promise<PluginReturnCode> {
    // Get a list of emoji IDs from the message
    const regex = new RegExp("<:angry([0-9]{1,3}):[0-9]+>", "g");
    const matches = Array.from(message.cleanContent.matchAll(regex), m => m[1]);

    const userId = message.author.id;

    // Give the user a max of 100 coins per day for every emoji sent
    const userCache = getUserActionCache(userId);
    if (userCache) {
        let cashEarned = matches.length;
        const total = userCache.emojiCash + matches.length;
        if (total > 100) {
            cashEarned = 100 - userCache.emojiCash;
        }
        if (cashEarned > 0) {
            await updateUserBalance({ userId, amount: cashEarned });
        }
    } else {
        const emojiCount = matches.length > 100 ? 100 : matches.length;
        await updateUserBalance({ userId, amount: emojiCount });
    }
    updateUserActionCache(userId, { emojiCash: matches.length });

    await Stats.findOneAndUpdate(
        { key: "total-angry-emojis-sent" },
        { $inc: { value: matches.length } },
        { upsert: true, new: true }
    ).exec();

    const emojis = matches.reduce((acc, emojiId) => {
        acc[emojiId] = (acc[emojiId] ?? 0) + 1;
        return acc;
    }, {} as { [key: string]: number });

    const userEmojis = deepCopy((await getUser(userId))?.emojis ?? {});

    for (const [emojiId, count1] of Object.entries(emojis)) {
        userEmojis[emojiId] = (userEmojis[emojiId] ?? 0) + count1;
    }

    await updateUser(userId, {
        userName: message.author.username,
        emojis: userEmojis,
    });

    return "CONTINUE";
}
