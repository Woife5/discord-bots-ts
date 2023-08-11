import type { Message, PartialMessage } from "discord.js";
import { incrementStatAndUser, Log, CensorshipUtil } from "@helpers";
import { getPowerUpdate, hasPower, updateUser } from "helpers/user.util";
import type { PluginReturnCode } from "@woife5/shared/lib/messages/message-wrapper";
import { clientId } from "@woife5/shared/lib/utils/env.util";
import { hasEmoji } from "@woife5/shared/lib/utils/string.util";

const log = new Log("Censorship");

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function censor(message: Message | PartialMessage): Promise<PluginReturnCode> {
    const censored = await CensorshipUtil.getAll();

    if (censored.size <= 0 || !message.content || !message.author) {
        return "CONTINUE";
    }

    let hasToBeCensored = false;
    let censoredContent = message.content.replaceAll("\\", "\\ ");

    const hasImmunity = await hasPower(message.author.id, "censorship-immunity");
    let usedImmunity = false;

    for (const [owner, words] of censored) {
        for (const word of words) {
            let regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, "ig");
            if (hasEmoji(word)) {
                regex = new RegExp(escapeRegExp(word), "ig");
            }

            if (regex.test(message.content?.toLowerCase())) {
                if (hasImmunity && owner !== clientId) {
                    usedImmunity = true;
                    continue;
                }

                hasToBeCensored = true;
                censoredContent = censoredContent.replace(regex, "`CENSORED` ");
            }
        }
    }

    if (usedImmunity) {
        const powerUpdate = await getPowerUpdate(message.author.id, "censorship-immunity", -1);
        await updateUser(message.author.id, powerUpdate);
    }

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
