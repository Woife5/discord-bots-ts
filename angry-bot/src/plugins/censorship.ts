import type { Message, PartialMessage } from "discord.js";
import { incrementStatAndUser, Log, ConfigCache, PluginReturnCode } from "@helpers";

const log = new Log("Censorship");

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function censor(message: Message | PartialMessage): Promise<PluginReturnCode> {
    const censored = await ConfigCache.get("censored");

    if (!censored || !message.content) {
        return "CONTINUE";
    }

    let hasToBeCensored = false;
    let censoredContent = message.content.replaceAll("\\", "\\ ");
    const censoredStrings = censored as string[];

    censoredStrings.forEach(string => {
        if (message.content?.toLowerCase().includes(string)) {
            hasToBeCensored = true;
            const regex = new RegExp(escapeRegExp(string), "ig");
            censoredContent = censoredContent.replace(regex, "`CENSORED` ");
        }
    });

    if (!hasToBeCensored) {
        return "CONTINUE";
    }

    if (censoredContent.length >= 1940) {
        const cutAt = censoredContent.indexOf(" ", 1850);
        if (cutAt < 0 || cutAt > 1950) {
            censoredContent = censoredContent.substring(0, 1950);
        } else {
            censoredContent = censoredContent.substring(0, cutAt);
        }
    }

    censoredContent = `${message.author}, ${censoredContent}\nThat is illegal!`;

    try {
        if (message.deletable) {
            await message.channel.send(censoredContent);
            await message.delete();
            if (message.author) {
                await incrementStatAndUser("times-censored", message.author);
            }
        } else {
            log.error(`Message is not deletable in guild ${message.guild?.name} with id ${message.guild?.id}`);

            return "CONTINUE";
        }
    } catch (error) {
        log.error(error);
    }

    return "DELETED";
}
