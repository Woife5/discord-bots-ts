import { angryEmojis, angryReactionsAmount, customReactions } from "@data";
import { Stats } from "@helpers";
import type { PluginReturnCode } from "@woife5/shared";
import type { Message } from "discord.js";

export async function react(message: Message): Promise<PluginReturnCode> {
    let angrys = angryReactionsAmount;
    if (message.author.id in customReactions) {
        const reactions = customReactions[message.author.id].reactions;
        angrys = customReactions[message.author.id].angrys;

        for (let i = 0; i < reactions.length; i++) {
            try {
                await message.react(reactions[i]);
            } catch {
                // ignore errors
            }
        }
    } else {
        for (let i = 0; i < angryReactionsAmount; i++) {
            try {
                await message.react(angryEmojis[i]);
            } catch {
                // ignore errors
            }
        }
    }

    await Stats.findOneAndUpdate(
        { key: "angry-reactions" },
        { $inc: { value: angrys } },
        { upsert: true, returnDocument: "after" },
    ).exec();

    return "CONTINUE";
}
