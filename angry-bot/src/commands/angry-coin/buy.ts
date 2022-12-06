import { Message, EmbedBuilder, User as DiscordUser, ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { angryIconCDN } from "@data";
import { ICommand } from "../command-interfaces";
import { invalidateUserCache, isUserPower, Powers, Service, User, ConfigCache } from "@helpers";
import { config } from "dotenv";

type ShopItem = {
    name: string;
    value: Powers | Service;
    isOwnable: Boolean;
    description: string;
    price: number;
};

const shopItems: ShopItem[] = [
    {
        name: "Censorship immunity",
        value: "censorship-immunity",
        isOwnable: true,
        description: "Be immune to censorship for 10 usages.",
        price: 10,
    },
    {
        name: "Censorship item",
        value: "censorship-item",
        isOwnable: true,
        description: "Censor something you dont like!",
        price: 500,
    },
    {
        name: "Un-censorship item",
        value: "un-censorship-item",
        isOwnable: false,
        description: "Un-censor something you like again!",
        price: 1000,
    }
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
        )
        .addStringOption(option =>
            option
                .setName("value")
                .setDescription("For personalized purchaces 🥰")
                .setRequired(false)
        ),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const user = interaction.user;
        const item = interaction.options.getString("item");
        const amount = interaction.options.getInteger("amount") ?? 1;
        const value = interaction.options.getString("value");

        interaction.reply({ embeds: [await runCommand(user, item, amount, value)] });
    },
    executeMessage: async (message: Message, args: string[]): Promise<void> => {
        const user = message.author;
        const item = args[0];
        const amount = parseInt(args[1]) ?? 1;

        message.reply({ embeds: [await runCommand(user, item, amount, null)] });
    },
};

async function runCommand(discordUser: DiscordUser, item: string | null, amount: number, value: string | null) {
    const user = await User.findOne({ userId: discordUser.id });

    const shopItemIndex = shopItems.findIndex(i => i.value === item);
    if (shopItemIndex === -1 || isNaN(amount) || amount <= 0) {
        return shopEmbed();
    }

    const shopItem = shopItems[shopItemIndex];

    if (shopItem.value == "censorship-item" || shopItem.value == "un-censorship-item")
        amount = 1;

    if (!user || user.angryCoins < shopItem.price * amount) {
        return defaultEmbed().setDescription("You don't have enough angry coins to buy that item.");
    }


    if (isUserPower(shopItem.value)) {
        user.angryCoins -= shopItem.price * amount;
        if (!user.powers[shopItem.value]) {
            user.powers[shopItem.value] = 0;
        }

        user.powers[shopItem.value] += amount;
        user.markModified("powers");
    }

    if (shopItem.value == "censorship-item") {
        if (!value)
            return defaultEmbed().setDescription("I need a string to censor, buddy");

        const censoredString = value.toLowerCase().trim();

        const config = await ConfigCache.get("censored");

        if (config && config.has(censoredString))
            return defaultEmbed().setDescription("This string is already censored!");

        user.angryCoins -= shopItem.price;

        let newConfig: Map<string, string>;
        if (!config)
            newConfig = new Map<string, string>();
        else
            newConfig = new Map(config);
        newConfig.set(censoredString, discordUser.id)
        await ConfigCache.set({ key: "censored", value: newConfig });
    }

    if (shopItem.value == "un-censorship-item") {
        if (!value)
            return defaultEmbed().setDescription("I need a string to un-censor, buddy");

        const censoredString = value.toLowerCase().trim();

        const config = await ConfigCache.get("censored");

        if (!config || !config.has(censoredString))
            return defaultEmbed().setDescription("This string is not censored.");

        if (config && config.get(censoredString) != discordUser.id)
            return defaultEmbed().setDescription("<@" + config.get(censoredString) + "> owns this censorship!");

        user.angryCoins -= shopItem.price;

        let newConfig = new Map(config);
        newConfig.delete(censoredString);
        await ConfigCache.set({ key: "censored", value: newConfig });
    }

    await user.save();
    invalidateUserCache(user.userId);

    // handle non-power item purchases here
    // i think it should be possible to ask the user for another input
    // otherwise we could just add "arguments" or something to the options
    // where we can pass in any other data that is needed for the purchase (e.g. what to censor)

    return defaultEmbed().setTitle("Purchase successful").setDescription(`You bought ${amount} ${shopItem.name}.`);
}

function defaultEmbed() {
    return new EmbedBuilder().setColor("Aqua").setAuthor({ name: "Angry", iconURL: angryIconCDN });
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
