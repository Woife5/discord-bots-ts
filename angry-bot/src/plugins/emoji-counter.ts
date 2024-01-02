import { Stats } from "@helpers";
import { Message } from "discord.js";
import { getUser, getUserActionCache, updateUser, updateUserActionCache } from "helpers/user.util";
import type { PluginReturnCode } from "@woife5/shared/lib/messages/message-wrapper";
import { deepCopy } from "@woife5/shared/lib/utils/object.util";

const emojiRegex = new RegExp("<:angry([0-9]{1,3}):[0-9]+>", "g");

export async function count(message: Message): Promise<PluginReturnCode> {
    // Get a list of emoji IDs from the message
    const matches = Array.from(message.content.matchAll(emojiRegex), m => m[1]);

    // Get a list of all the stickers sent
    const stickerList = Array.from(message.stickers.values())
        .filter(s => s.name.toLowerCase().includes("angry"))
        .map(s => s.name);

    // If no emojis or stickers were sent, return
    if (matches.length <= 0 && stickerList.length <= 0) {
        return "CONTINUE";
    }

    const userId = message.author.id;
    const user = await getUser(userId);

    // Give the user a max of 100 coins per day for every emoji sent
    // Additionally every sticker sent will grant 1 coin
    const moneyEarned = getMoneyEarned(userId, matches.length) + stickerList.length;
    updateUserActionCache(userId, { emojiCash: matches.length });

    await Stats.findOneAndUpdate(
        { key: "total-angry-emojis-sent" },
        { $inc: { value: matches.length } },
        { upsert: true, new: true }
    ).exec();

    await Stats.findOneAndUpdate(
        { key: "total-angry-stickers-sent" },
        { $inc: { value: stickerList.length } },
        { upsert: true, new: true }
    ).exec();

    const emojis = matches.reduce(
        (acc, emojiId) => {
            acc[emojiId] = (acc[emojiId] ?? 0) + 1;
            return acc;
        },
        {} as { [key: string]: number }
    );

    const stickers = stickerList.reduce(
        (acc, stickerName) => {
            acc[stickerName] = (acc[stickerName] ?? 0) + 1;
            return acc;
        },
        {} as { [key: string]: number }
    );

    const userEmojis = deepCopy(user?.emojis ?? {});
    const userStickers = deepCopy(user?.stickers ?? {});

    for (const [emojiId, count1] of Object.entries(emojis)) {
        userEmojis[emojiId] = (userEmojis[emojiId] ?? 0) + count1;
    }

    for (const [stickerName, count2] of Object.entries(stickers)) {
        userStickers[stickerName] = (userStickers[stickerName] ?? 0) + count2;
    }

    const initialBalance = user?.angryCoins ?? 0;
    await updateUser(userId, {
        userName: message.author.username,
        emojis: userEmojis,
        stickers: userStickers,
        angryCoins: initialBalance + moneyEarned,
    });

    return "CONTINUE";
}

function getMoneyEarned(userId: string, emojisSent: number): number {
    const userCache = getUserActionCache(userId);
    if (!userCache) {
        const emojiCount = emojisSent > 100 ? 100 : emojisSent;
        return emojiCount;
    }

    let cashEarned = emojisSent;
    const total = userCache.emojiCash + emojisSent;
    if (total > 100) {
        cashEarned = 100 - userCache.emojiCash;
    }
    if (cashEarned > 0) {
        return cashEarned;
    }
    return 0;
}
