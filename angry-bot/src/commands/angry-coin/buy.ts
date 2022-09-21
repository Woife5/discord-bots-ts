import { CommandInteraction, Message, MessageEmbed, User as DiscordUser } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { angryIconCDN } from "@data";
import { ICommand } from "../command-interfaces";
import { Powers, User } from "@helpers";

type ShopItem = {
    name: string;
    value: Powers;
    description: string;
    price: number;
};

const shopItems: ShopItem[] = [
    {
        name: "Censorship immunity",
        value: "censorship-immunity",
        description: "Be immune to censorship for 10 usages.",
        price: 1,
    },
];

export const buy: ICommand = {
    data: new SlashCommandBuilder()
        .setName("buy")
        .setDescription("Buy something from the angry shop.")
        .addStringOption(option =>
            option
                .setName("item")
                .setDescription("The item you want to buy.")
                .setRequired(false)
                .addChoices(
                    ...shopItems.map(item => ({ name: `${item.name} (${item.price} coins)`, value: item.value }))
                )
        )
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("How many times do you want to purchase this item?")
                .setRequired(false)
        ),
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        const user = interaction.user;
        const item = interaction.options.getString("item");
        const amount = interaction.options.getInteger("amount") ?? 1;

        interaction.reply({ embeds: [await runCommand(user, item, amount)] });
    },
    executeMessage: async (message: Message, args: string[]): Promise<void> => {
        const user = message.author;
        const item = args[0];
        const amount = parseInt(args[1]) ?? 1;

        message.reply({ embeds: [await runCommand(user, item, amount)] });
    },
};

async function runCommand(discordUser: DiscordUser, item: string | null, amount: number) {
    const user = await User.findOne({ userId: discordUser.id });

    const shopItemIndex = shopItems.findIndex(i => i.value === item);
    if (shopItemIndex === -1 || isNaN(amount) || amount <= 0) {
        return shopEmbed();
    }

    const shopItem = shopItems[shopItemIndex];

    if (!user || user.angryCoins < shopItem.price * amount) {
        return defaultEmbed().setDescription("You don't have enough angry coins to buy that item.");
    }

    user.angryCoins -= shopItem.price * amount;

    if (!user.powers[shopItem.value]) {
        user.powers[shopItem.value] = 0;
    }

    user.powers[shopItem.value] += amount;
    user.markModified("powers");
    await user.save();

    return defaultEmbed().setTitle("Purchase successful").setDescription(`You bought ${amount} ${shopItem.name}.`);
}

function defaultEmbed() {
    return new MessageEmbed().setColor("AQUA").setAuthor({ name: "Angry", iconURL: angryIconCDN });
}

function shopEmbed() {
    return defaultEmbed()
        .setTitle("Shop Items")
        .addFields(
            shopItems.map(item => ({
                name: item.name,
                value: `\`${item.value}\`: ${item.description} (${item.price} angry coins)`,
            }))
        );
}
