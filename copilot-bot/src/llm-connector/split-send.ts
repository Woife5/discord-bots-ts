import { MessageFlags, type PartialTextBasedChannelFields, TextDisplayBuilder } from "discord.js";

async function send(message: string, channel: PartialTextBasedChannelFields) {
    const text = new TextDisplayBuilder().setContent(message);
    await channel.send({ components: [text], flags: MessageFlags.IsComponentsV2 });
}

export async function splitAndSendAsComponents(message: string, channel: PartialTextBasedChannelFields) {
    if (message.length > 2000) {
        // Discord message limit is 2000 characters
        const chunks = message.match(/[\s\S]{1,2000}/g) || [];
        for (const chunk of chunks) {
            await send(chunk, channel);
        }
    } else {
        await send(message, channel);
    }
}
