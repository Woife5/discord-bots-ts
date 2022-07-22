import { Message } from "discord.js";
import { User, Stats } from "@helpers";

export async function count(message: Message) {
    // Get a list of emoji IDs from the message
    const regex = new RegExp("<:angry([0-9]{1,3}):[0-9]+>", "g");
    const matches = Array.from(message.cleanContent.matchAll(regex), m => m[1]);

    const userId = message.author.id;

    await Stats.findOneAndUpdate(
        { key: "total-angry-emojis-sent" },
        { $inc: { value: matches.length } },
        { upsert: true, new: true }
    ).exec();

    const emojis = matches.reduce((acc, emojiId) => {
        acc[emojiId] = (acc[emojiId] ?? 0) + 1;
        return acc;
    }, {} as { [key: string]: number });

    for (const [emojiId, count1] of Object.entries(emojis)) {
        await User.findOneAndUpdate(
            { userId },
            { $inc: { [`emojis.${emojiId}`]: count1 } },
            { upsert: true, new: true }
        ).exec();
    }
}
