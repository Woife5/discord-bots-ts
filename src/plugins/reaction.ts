import { Message } from 'discord.js';
import { customReactions, angryEmojis, angryReactionsAmount } from '@data';
import { User, Stats } from '@helpers';

export async function react(message: Message) {
    let angrys = angryReactionsAmount;
    if (message.author.id in customReactions) {
        const reactions = customReactions[message.author.id].reactions;
        angrys = customReactions[message.author.id].angrys;

        for (let i = 0; i < reactions.length; i++) {
            try {
                await message.react(reactions[i]);
            } catch (e) {
                console.error(e);
            }
        }
    } else {
        for (let i = 0; i < angryReactionsAmount; i++) {
            try {
                await message.react(angryEmojis[i]);
            } catch (e) {
                console.error(e);
            }
        }
    }

    await Stats.findOneAndUpdate(
        { key: 'angry-reactions' },
        { $inc: { value: angrys } },
        { upsert: true, new: true }
    ).exec();
}
