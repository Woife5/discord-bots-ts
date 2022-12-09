import { Message, EmbedBuilder, User as DiscordUser, ChatInputCommandInteraction, ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, Interaction, PartialGroupDMChannel } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { angryIconCDN } from "@data";
import { ICommand } from "../command-interfaces";
import { invalidateUserCache, isUserPower, Powers, ShopItems as ShopItemNames, User, ConfigCache, IUser } from "@helpers";
import { Document } from "mongoose";

type ShopItem = {
    name: Powers | ShopItemNames;
    description: string;
    amount: Boolean;
    message: Boolean;
    price: number;
};

const shopItems: ShopItem[] = [
    {
        name: "censorship-immunity",
        description: "Be immune to censorship for 1 message! 💪",
        amount: true,
        message: false,
        price: 10,
    },
    {
        name: "censorship",
        description: "Censor something you dont like! 😤",
        amount: false,
        message: true,
        price: 500,
    },
    {
        name: "un-censorship",
        description: "Un-censor something you like again! 🥰",
        amount: false,
        message: true,
        price: 1000,
    }
];

const data = new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Shop for things!');


shopItems.forEach((shopItem) => {
    data.addSubcommand(subcommand => {
        subcommand.setName(shopItem.name).setDescription(shopItem.description)
        .setDescription(`(${shopItem.price} Coins) ${shopItem.description}`);
        if (shopItem.message)
            subcommand.addStringOption(option => option.setName("message").setDescription("For personalized purchaces 🥰").setRequired(true));
        if (shopItem.amount)
            subcommand.addIntegerOption(option => option.setName("amount").setDescription("How many times do you want to purchase this item?").setRequired(false))
        return subcommand;
    })
});

export const buy: ICommand = {
    data: data,
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const user = interaction.user;
        const item = interaction.options.getSubcommand();
        const amount = interaction.options.getInteger("amount") ?? 1;
        const value = interaction.options.getString("message") ?? "";

        runShopCommand(interaction, user, item, amount, value);
    },
    executeMessage: async (message: Message, args: string[]): Promise<void> => {
        message.reply({embeds: [defaultEmbed().setDescription("Please use slash commands to access the angry shop 🤮")]});
    },
};


async function handleRegularPurchase(user : Document & IUser | null, shopItem : ShopItem, amount : number)  : Promise<EmbedBuilder>
{
    if (!user || user.angryCoins < shopItem.price * amount) {
        return defaultEmbed().setDescription("You don't have enough angry coins to buy that item.");
    }

    if (isUserPower(shopItem.name)) {
        user.angryCoins -= shopItem.price * amount;
        if (!user.powers[shopItem.name]) {
            user.powers[shopItem.name] = 0;
        }

        user.powers[shopItem.name] += amount;
        user.markModified("powers");
    }

    await user.save();
    invalidateUserCache(user.userId);
    return defaultEmbed().setTitle("Purchase successful").setDescription(`You bought ${amount} ${shopItem.name}.`);
}

async function handleCensorshipPurchase(user : Document & IUser | null, shopItem : ShopItem, message : string) : Promise<EmbedBuilder>
{
    if (!user || user.angryCoins < shopItem.price) {
        return defaultEmbed().setDescription("You don't have enough angry coins to buy that item.");
    }

    const censoredString = message.toLowerCase().trim();
    const config = await ConfigCache.get("censored");

    if (shopItem.name == "censorship") {
        if (config && config.has(censoredString))
            return defaultEmbed().setDescription("This string is already censored!");

        let newConfig: Map<string, string>;
        if (!config)
            newConfig = new Map<string, string>();
        else
            newConfig = new Map(config);
        newConfig.set(censoredString, user.id)
        await ConfigCache.set({ key: "censored", value: newConfig });
        user.angryCoins -= shopItem.price;

        await user.save();
        invalidateUserCache(user.userId);
        return defaultEmbed().setTitle("Purchase successful").setDescription(`You bought \`${message}\`!`);
    }

    if (shopItem.name == "un-censorship") {
        if (!config || !config.has(censoredString))
            return defaultEmbed().setDescription("This string is not censored.");

        if (config && config.get(censoredString) != user.id) {
            /*
            buttonRow.addComponents(
                new ButtonBuilder().setCustomId('confirm_uncensorship_purchase').setEmoji('😍').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('cancel_uncensorship_purchase').setEmoji('🤮').setStyle(ButtonStyle.Danger),
            );

            reactionHandler.handleReaction = async (interaction: ChatInputCommandInteraction | Message) => {
                let interactionUser = (typeof(interaction) == typeof(ChatInputCommandInteraction))? (interaction as ChatInputCommandInteraction).user : (interaction as Message).author;
                if (interaction.channel) {
                    const filter = (btnInt: any) => interactionUser.id === btnInt.user.id;
                    const collector = interaction.channel.createMessageComponentCollector({ filter, max: 1, time: 15 * 1000 });
                    collector.on('collect', async (i: ButtonInteraction) => {
                        if (i.customId === "confirm_uncensorship_purchase") {
                            if (user.angryCoins < shopItem.price + 500)
                                await i.reply({ content: 'You dont have enough coins!', components: [] });
                            else {
                                user.angryCoins -= shopItem.price + 500;
                                let newConfig = new Map(config);
                                newConfig.delete(censoredString);
                                await ConfigCache.set({ key: "censored", value: newConfig });
                                await i.reply({ content: 'Purchase confirmed!', components: [] });
                            }
                        }
                        else
                            await i.reply({ content: 'Purchase canceled!', components: [] });
                    });
                    collector.on('end', () => { if (typeof(interaction) == typeof(ChatInputCommandInteraction)) (interaction as ChatInputCommandInteraction).editReply({ components: [] }) });

                }
            }
            */
            return defaultEmbed().setDescription("<@" + config.get(censoredString) + "> owns `" + censoredString + "`! \n Remove for an additional 500 Angry Coins?")
        }
        user.angryCoins -= shopItem.price;
        let newConfig = new Map(config);
        newConfig.delete(censoredString);
        await ConfigCache.set({ key: "censored", value: newConfig });
        await user.save();
        invalidateUserCache(user.userId);
        return defaultEmbed().setTitle("Purchase successful").setDescription(`You liberated \`${message}\`!`);
    }
    return defaultEmbed().setDescription("Hi if you read this message something went wrong. Please ping <@267281854690754561> 50 times 🥰");
}


async function runShopCommand(interaction: ChatInputCommandInteraction, discordUser: DiscordUser, item: string | null, amount: number, message: string) {

    const user = await User.findOne({ userId: discordUser.id });

    const shopItemIndex = shopItems.findIndex(i => i.name === item);
    if (shopItemIndex === -1 || isNaN(amount) || amount <= 0) {
        return shopEmbed();
    }

    const shopItem = shopItems[shopItemIndex];

    let embed : EmbedBuilder;

    if (!(shopItem.name == "censorship" || shopItem.name == "un-censorship"))
    {
        embed = await handleRegularPurchase(user, shopItem, amount);
    }
    else
    {
        embed = await handleCensorshipPurchase(user, shopItem, message)
    }
    interaction.reply({embeds: [embed], /*components : components*/});
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
                value: `\`${item.name}\`: ${item.description} (${item.price} angry coins)`,
            }))
        );
}
