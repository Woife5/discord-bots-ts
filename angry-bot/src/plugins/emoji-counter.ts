import { Message } from "discord.js";
import { User, Stats, PluginReturnCode, createUser } from "@helpers";

export async function count(message: Message): Promise<PluginReturnCode> {
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

    let user = await User.findOne({ userId });

    if (!user) {
        user = await createUser(message.author);
    }

    // can be removed once every user is updated
    if (!user.emojis) {
        user.emojis = {};
    }

    for (const [emojiId, count1] of Object.entries(emojis)) {
        user.emojis[emojiId] = (user.emojis[emojiId] ?? 0) + count1;
    }

    user.markModified("emojis");
    await user.save();

    return "CONTINUE";
}
