import { MessageUtils, PluginReturnCode } from "@helpers";
import type { Message } from "discord.js";

export async function react(message: Message): Promise<PluginReturnCode> {
    if (MessageUtils.cleanContains(message, "medien") || MessageUtils.cleanContains(message, "theorie")) {
        const medienMessage = await message.reply("Medientheorie!");
        await medienMessage.react("❤️");
        await medienMessage.react("♥");
        return "ABORT";
    }

    return "CONTINUE";
}
