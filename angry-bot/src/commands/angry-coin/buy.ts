import { Message, EmbedBuilder, User as DiscordUser, ChatInputCommandInteraction, ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionResponse } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { angryIconCDN, uncensorable } from "@data";
import { ICommand } from "../command-interfaces";
import { invalidateUserCache, isUserPower, Powers, ShopItems as ShopItemNames, User, IUser, CensorshipUtil } from "@helpers";
import { Document } from "mongoose";

type ShopItem = {
    name: Powers | ShopItemNames;
    description: string;
    amount: Boolean;
    message: Boolean;
    minMessage?: number;
    maxMessage?: number;
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
        maxMessage: 100,
        price: 500,
    },
    {
        name: "un-censorship",
        description: "Un-censor something you like again! 🥰",
        amount: false,
        message: true,
        price: 300,
    },
];

const data = new SlashCommandBuilder().setName("buy").setDescription("Shop for things!");

shopItems.forEach(shopItem => {
    data.addSubcommand(subcommand => {
        subcommand
            .setName(shopItem.name)
            .setDescription(shopItem.description)
            .setDescription(`(${shopItem.price} Coins) ${shopItem.description}`);
        if (shopItem.message)
            subcommand.addStringOption(option => {
                option.setName("message").setDescription("For personalized purchaces 🥰").setRequired(true);
                if (shopItem.maxMessage) option.setMaxLength(shopItem.maxMessage);
                if (shopItem.minMessage) option.setMinLength(shopItem.minMessage);
                return option;
            });
        if (shopItem.amount) {
            subcommand.addIntegerOption(option =>
                option
                    .setName("amount")
                    .setDescription("How many times do you want to purchase this item?")
                    .setRequired(false)
            );
        }
        return subcommand;
    });
});

export const buy: ICommand = {
    data: data,
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const user = interaction.user;
        const item = interaction.options.getSubcommand();
        const amount = interaction.options.getInteger("amount") ?? 1;
        const value = interaction.options.getString("message") ?? "";

        await runShopCommand(interaction, user, item, amount, value);
    },
    executeMessage: async (message: Message, args: string[]): Promise<void> => {
        message.reply({
            embeds: [defaultEmbed().setDescription("Please use slash commands to access the angry shop 🤮🤮🤮")],
        });
    },
};

async function runShopCommand(
    interaction: ChatInputCommandInteraction,
    discordUser: DiscordUser,
    item: string | null,
    amount: number,
    message: string
) {
    const user = await User.findOne({ userId: discordUser.id });
    const shopItemIndex = shopItems.findIndex(i => i.name === item);
    if (shopItemIndex === -1 || isNaN(amount) || amount <= 0) {
        return shopEmbed();
    }
    const shopItem = shopItems[shopItemIndex];

    if (!(shopItem.name == "censorship" || shopItem.name == "un-censorship"))
        await regularPurchase(interaction, user, shopItem, amount);
    else await censorshipPurchase(interaction, user, shopItem, message);
}

async function regularPurchase(
    interaction: ChatInputCommandInteraction,
    user: (Document & IUser) | null,
    shopItem: ShopItem,
    amount: number
): Promise<InteractionResponse<boolean>> {
    const embed = defaultEmbed();
    if (!user || user.angryCoins < shopItem.price * amount)
        return interaction.reply({embeds: [embed.setDescription("You don't have enough angry coins to buy this item.")], ephemeral: true});

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
    return interaction.reply({embeds: [embed.setTitle("Purchase successful").setDescription(`You bought ${amount} ${shopItem.name}.`)]});
}

async function censorshipPurchase(
    interaction: ChatInputCommandInteraction,
    user: (Document & IUser) | null,
    shopItem: ShopItem,
    message: string
): Promise<InteractionResponse<boolean>> {
    const embed = defaultEmbed();
    if (!user || user.angryCoins < shopItem.price) {
        return interaction.reply({embeds: [embed.setDescription("You don't have enough angry coins to buy this item.")]});
    }

    const censoredString = filterCensorMessage(message);
    if (shopItem.name == "censorship") {
        return buyCensorship(interaction, user, shopItem.price, censoredString);
    }
    if (shopItem.name == "un-censorship") {
        return buyRemoveCensorship(interaction, user, shopItem.price, censoredString, 500);
    }
    return interaction.reply({embeds: [embed.setDescription("Hi if you read this message something went wrong. Please ping <@267281854690754561> 50 times 🥰")]});
}

async function buyCensorship(
    interaction: ChatInputCommandInteraction,
    user: Document & IUser,
    price: number,
    censoredString: string
): Promise<InteractionResponse<boolean>> {
    const embed = defaultEmbed();
    if (censoredString.length < 4 && !hasEmoji(censoredString)) {
        return interaction.reply({ embeds: [embed.setDescription("This string is too short for censorship! 😟 \n Enter at least 4 charcters or an emoji.")],ephemeral: true});
    }
    if (!isCensorable(censoredString)) {
        return interaction.reply({ embeds: [embed.setDescription("Sorry this string is forbidden from censoring 😨")],ephemeral: true});
    }

    if (await CensorshipUtil.isCensored(censoredString)) {
        return interaction.reply({ embeds: [embed.setDescription("This string is already censored!")],ephemeral: true});
    }

    CensorshipUtil.add({ owner: user.userId, value: censoredString });

    user.angryCoins -= price;
    await user.save();
    invalidateUserCache(user.userId);
    return interaction.reply({ embeds: [embed.setTitle("Purchase successful").setDescription(`You bought \`${censoredString}\`!`)]});
}

async function buyRemoveCensorship(
    interaction: ChatInputCommandInteraction,
    user: Document & IUser,
    price: number,
    censoredString: string,
    noOwnershipSurcharge: number
): Promise<InteractionResponse<boolean>> {
    const embed = defaultEmbed();
    const owner = await CensorshipUtil.findOwner(censoredString);
    if (owner == null) {
        return interaction.reply({ embeds: [embed.setDescription("This string is not censored.")], ephemeral: true });
    }

    if (owner === user.userId) {
        user.angryCoins -= price;
        await CensorshipUtil.remove(censoredString);
        await user.save();
        invalidateUserCache(user.userId);
        return interaction.reply({ embeds: [embed.setTitle("Purchase successful").setDescription(`You liberated \`${censoredString}\`!`)] });
    }

    //surcharge button choice if user does not own censorship
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("confirm_uncensorship_purchase").setEmoji("😍").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("cancel_uncensorship_purchase").setEmoji("🤮").setStyle(ButtonStyle.Danger)
    );

    if (!interaction.channel) {
        //idk i made this to get rid of the ugly red squiggly lines
        return interaction.reply({ embeds: [embed.setDescription("What uwu why does this interaction have no channel? >.< sowwy dont know what to do"),], ephemeral: true, });
    }
    const filter = (buttonInteraction: any) => interaction.user.id === buttonInteraction?.user?.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, max: 1, time: 15 * 1000 });
    collector.on("collect", async (buttonInteraction: ButtonInteraction) => {
        if (buttonInteraction.customId === "confirm_uncensorship_purchase") {
            if (user.angryCoins < price + noOwnershipSurcharge) {
                buttonInteraction.reply({ content: "You dont have enough coins!", components: [] });
                return;
            }
            await CensorshipUtil.remove(censoredString);
            user.angryCoins -= price + noOwnershipSurcharge;
            await user.save();
            invalidateUserCache(user.userId);
            await buttonInteraction.reply({ content: `Purchase confirmed! \n You liberated \`${censoredString}\` from <@${owner}>!`, components: [], });
        }
        if (buttonInteraction.customId === "cancel_uncensorship_purchase") {
            await buttonInteraction.reply({ content: "Purchase canceled!", components: [] });
        }
    });
    collector.on("end", () => {
        interaction.editReply({ components: [] });
    });
    return interaction.reply({ embeds: [embed.setDescription(`<@${owner}> owns \`${censoredString}\`! \n Remove for an additional ${noOwnershipSurcharge} Angry Coins?`),], components: [buttonRow], ephemeral: true, });
}

function filterCensorMessage(message: string): string {
    return message.toLowerCase().trim();
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

function isCensorable(censorString: string): Boolean {
    for (const word of uncensorable) {
        if (censorString.match(word)) return false;
    }
    return true;
}

function hasEmoji(text: string) {
    return /\p{Extended_Pictographic}/u.test(text);
}
