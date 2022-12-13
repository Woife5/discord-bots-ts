import { Message } from "discord.js";
import { customReactions, angryEmojis, angryReactionsAmount } from "@data";
import { Stats, Log } from "@helpers";
import type { PluginReturnCode } from "shared/lib/messages/message-wrapper";

const log = new Log("Reaction");

export async function react(message: Message): Promise<PluginReturnCode> {
    let angrys = angryReactionsAmount;
    if (message.author.id in customReactions) {
        const reactions = customReactions[message.author.id].reactions;
        angrys = customReactions[message.author.id].angrys;

        for (let i = 0; i < reactions.length; i++) {
            try {
                await message.react(reactions[i]);
            } catch (e) {
                log.error(e);
            }
        }
    } else {
        for (let i = 0; i < angryReactionsAmount; i++) {
            try {
                await message.react(angryEmojis[i]);
            } catch (e) {
                log.error(e);
            }
        }
    }

    await Stats.findOneAndUpdate(
        { key: "angry-reactions" },
        { $inc: { value: angrys } },
        { upsert: true, new: true }
    ).exec();

    return "CONTINUE";
}
