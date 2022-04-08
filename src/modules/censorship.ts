import type { Message } from 'discord.js';
import { MessageUtils } from '../helpers';
import { Config } from '../helpers/db-helpers';

export async function censor(message: Message) {
    const censored = await Config.findOne({ key: 'censored' });

    if (!censored) {
        return;
    }

    let hasToBeCensord = false;
    let censoredContent = message.cleanContent.replaceAll('\\', '\\ ');
    const censoredStrings = censored.value as string[];

    censoredStrings.forEach(string => {
        if (MessageUtils.contains(message, string)) {
            hasToBeCensord = true;
            const regex = new RegExp(string, 'ig');
            censoredContent = censoredContent.replace(regex, '`CENSORED` ');
        }
    });

    if (!hasToBeCensord) {
        return;
    }

    if (censoredContent.length >= 1940) {
        const cutAt = censoredContent.indexOf(' ', 1850);
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
        } else {
            console.error('Require more permissions!');
        }
    } catch (error) {
        console.error(error);
    }
}
