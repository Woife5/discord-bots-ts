import { getRandomAdvertisement } from "@data";
import { CensorshipUtil, incrementStatAndUser } from "@helpers";
import type { PluginReturnCode } from "@woife5/shared";
import type { Message, PartialMessage } from "discord.js";
import { clientId } from "helpers/env.util";
import { getPowerUpdate, hasPower, updateUser } from "helpers/user.util";

let censoredCounter = 0;

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
            const regex = new RegExp(escapeRegExp(word), "ig");

            if (regex.test(message.content?.toLowerCase())) {
                if (hasImmunity && owner !== clientId) {
                    usedImmunity = true;
                    break;
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

    if (censoredContent.length >= 1900) {
        const cutAt = censoredContent.indexOf(" ", 1800);
        if (cutAt < 0 || cutAt > 1900) {
            censoredContent = censoredContent.substring(0, 1900);
        } else {
            censoredContent = censoredContent.substring(0, cutAt);
        }
    }

    censoredContent = `${message.author}, ${censoredContent}\nThat is illegal!`;

    censoredCounter += 1;
    if (censoredCounter > 5 && Math.random() > 0.8) {
        censoredContent += `\n\n${getRandomAdvertisement()}`;
        censoredCounter = 0;
    }

    try {
        if (message.deletable && message.channel.isSendable()) {
            await message.channel.send(censoredContent);
            await message.delete();
            if (message.author) {
                await incrementStatAndUser("times-censored", message.author);
            }
        } else {
            console.error(`Message is not deletable in guild ${message.guild?.name} with id ${message.guild?.id}`);
            return "CONTINUE";
        }
    } catch (error) {
        console.error("censorship.ts", error);
    }

    return "DELETED";
}
