import type { PluginReturnCode } from "@woife5/shared/lib/messages/message-wrapper";
import type { Message } from "discord.js";
import { cleanContains } from "@woife5/shared/lib/utils/message.util";

export async function react(message: Message): Promise<PluginReturnCode> {
    if (cleanContains(message, "medien") || cleanContains(message, "theorie")) {
        const medienMessage = await message.reply("Medientheorie!");
        await medienMessage.react("❤️");
        await medienMessage.react("♥");
        return "ABORT";
    }

    return "CONTINUE";
}
