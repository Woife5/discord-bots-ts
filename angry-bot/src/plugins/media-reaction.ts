import type { PluginReturnCode } from "@woife5/shared/lib/messages/message-wrapper";
import { cleanContains } from "@woife5/shared/lib/utils/message.util";
import type { Message } from "discord.js";

export async function react(message: Message): Promise<PluginReturnCode> {
    if (cleanContains(message, "medien") || cleanContains(message, "theorie")) {
        const medienMessage = await message.reply("Medientheorie!");
        await medienMessage.react("❤️");
        await medienMessage.react("♥");
        return "ABORT";
    }

    return "CONTINUE";
}
