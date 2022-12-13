import {
    Message,
    EmbedBuilder,
    ChatInputCommandInteraction,
    ButtonInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    InteractionResponse,
    ComponentType,
} from "discord.js";
import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { angryIconCDN, uncensorable } from "@data";
import { ICommand } from "../command-interfaces";
import { Powers, CensorshipUtil } from "@helpers";
import { getPowerUpdate, getUserBalance, isUserPower, updateUser } from "helpers/user.util";
import { hasEmoji, toCleanLowerCase } from "shared/lib/utils/string.util";

type ShopItemNames = "censorship" | "un-censorship";

type ShopItem = {
    name: Powers | ShopItemNames;
    description: string;
    price: number;
    addOptions: (subcommand: SlashCommandSubcommandBuilder) => SlashCommandSubcommandBuilder;
};

const amountOption = (subcommand: SlashCommandSubcommandBuilder) => {
    return subcommand.addIntegerOption(option =>
        option.setName("amount").setDescription("The amount of this item you would like to buy.").setRequired(false)
    );
};

const shopItems: ShopItem[] = [
    {
        name: "censorship-immunity",
        description: "Be immune to censorship for 1 message! 💪",
        price: 10,
        addOptions: amountOption,
    },
    {
        name: "censorship",
        description: "Censor something you dont like! 😤",
        price: 500,
        addOptions: (subcommand: SlashCommandSubcommandBuilder) => {
            return subcommand.addStringOption(option =>
                option
                    .setName("message")
                    .setDescription("The censored string to be censored.")
                    .setRequired(true)
                    .setMaxLength(100)
            );
        },
    },
    {
        name: "un-censorship",
        description: "Un-censor something you like again! 🥰",
        price: 300,
        addOptions: (subcommand: SlashCommandSubcommandBuilder) => {
            return subcommand.addStringOption(option =>
                option
                    .setName("message")
                    .setDescription("The censored string to be freed.")
                    .setRequired(true)
                    .setMaxLength(100)
            );
        },
    },
];

const data = new SlashCommandBuilder().setName("buy").setDescription("Shop for things!");

shopItems.forEach(shopItem => {
    data.addSubcommand(subcommand => {
        subcommand.setName(shopItem.name).setDescription(`(${shopItem.price} Coins) ${shopItem.description}`);
        return shopItem.addOptions(subcommand);
    });
});

export const buy: ICommand = {
    data: data,
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const user = interaction.user;
        const item = interaction.options.getSubcommand();
        const amount = interaction.options.getInteger("amount") ?? 1;
        const value = interaction.options.getString("message") ?? "";

        await runShopCommand(interaction, user.id, item, amount, value);
    },
    executeMessage: async (message: Message): Promise<void> => {
        message.reply({
            embeds: [defaultEmbed().setDescription("Please use slash commands to access the angry shop 🤮🤮🤮")],
        });
    },
};

async function runShopCommand(
    interaction: ChatInputCommandInteraction,
    userId: string,
    item: string,
    amount: number,
    message: string
) {
    const shopItemIndex = shopItems.findIndex(i => i.name === item);
    if (shopItemIndex === -1 || isNaN(amount) || amount <= 0) {
        interaction.reply({ embeds: [shopEmbed()] });
        return;
    }
    const shopItem = shopItems[shopItemIndex];

    if (!(shopItem.name == "censorship" || shopItem.name == "un-censorship")) {
        await regularPurchase(interaction, userId, shopItem, amount);
    } else {
        await censorshipPurchase(interaction, userId, shopItem, message);
    }
}

async function regularPurchase(
    interaction: ChatInputCommandInteraction,
    userId: string,
    shopItem: ShopItem,
    amount: number
): Promise<InteractionResponse<boolean>> {
    const embed = defaultEmbed();
    const userBalance = await getUserBalance(userId);
    if (userBalance < shopItem.price * amount) {
        return interaction.reply({
            embeds: [embed.setDescription("You don't have enough angry coins to buy this item.")],
            ephemeral: true,
        });
    }

    if (isUserPower(shopItem.name)) {
        const update = await getPowerUpdate(userId, shopItem.name, amount);
        update.angryCoins -= shopItem.price * amount;
        await updateUser(userId, update);
    }

    return interaction.reply({
        embeds: [embed.setTitle("Purchase successful").setDescription(`You bought ${amount} ${shopItem.name}.`)],
    });
}

async function censorshipPurchase(
    interaction: ChatInputCommandInteraction,
    userId: string,
    shopItem: ShopItem,
    message: string
): Promise<InteractionResponse<boolean>> {
    const embed = defaultEmbed();
    const userBalance = await getUserBalance(userId);
    if (userBalance < shopItem.price) {
        return interaction.reply({
            embeds: [embed.setDescription("You don't have enough angry coins to buy this item.")],
        });
    }

    const censoredString = toCleanLowerCase(message);
    if (shopItem.name == "censorship") {
        return buyCensorship(interaction, userId, shopItem.price, censoredString);
    }
    if (shopItem.name == "un-censorship") {
        return buyRemoveCensorship(interaction, userId, shopItem.price, censoredString, 500);
    }
    return interaction.reply({
        embeds: [
            embed.setDescription(
                "Hi if you read this message something went wrong. Please ping <@267281854690754561> 50 times 🥰"
            ),
        ],
    });
}

async function buyCensorship(
    interaction: ChatInputCommandInteraction,
    userId: string,
    price: number,
    censoredString: string
): Promise<InteractionResponse<boolean>> {
    const embed = defaultEmbed();
    if (censoredString.length < 4 && !hasEmoji(censoredString)) {
        return interaction.reply({
            embeds: [
                embed.setDescription(
                    "This string is too short for censorship! 😟 \n Enter at least 4 charcters or an emoji."
                ),
            ],
            ephemeral: true,
        });
    }
    if (uncensorable.filter(regex => regex.test(censoredString)).length > 0) {
        return interaction.reply({
            embeds: [embed.setDescription("Sorry this string is forbidden from censoring 😨")],
            ephemeral: true,
        });
    }

    if (await CensorshipUtil.isCensored(censoredString)) {
        return interaction.reply({
            embeds: [embed.setDescription("This string is already censored!")],
            ephemeral: true,
        });
    }

    const userBalance = await getUserBalance(userId);
    await CensorshipUtil.add({ owner: userId, value: censoredString });
    await updateUser(userId, { angryCoins: userBalance - price });

    return interaction.reply({
        embeds: [embed.setTitle("Purchase successful").setDescription(`You bought \`${censoredString}\`!`)],
    });
}

async function buyRemoveCensorship(
    interaction: ChatInputCommandInteraction,
    userId: string,
    price: number,
    censoredString: string,
    noOwnershipSurcharge: number
): Promise<InteractionResponse<boolean>> {
    const embed = defaultEmbed();
    const owner = await CensorshipUtil.findOwner(censoredString);
    if (owner == null) {
        return interaction.reply({ embeds: [embed.setDescription("This string is not censored.")], ephemeral: true });
    }

    const userBalance = await getUserBalance(userId);
    if (owner === userId) {
        await CensorshipUtil.remove(censoredString);
        await updateUser(userId, { angryCoins: userBalance - price });
        return interaction.reply({
            embeds: [embed.setTitle("Purchase successful").setDescription(`You liberated \`${censoredString}\`!`)],
        });
    }

    //surcharge button choice if user does not own censorship
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("confirm_uncensorship_purchase").setEmoji("😍").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("cancel_uncensorship_purchase").setEmoji("🤮").setStyle(ButtonStyle.Danger)
    );

    if (!interaction.channel) {
        //idk i made this to get rid of the ugly red squiggly lines
        return interaction.reply({
            embeds: [
                embed.setDescription(
                    "What uwu why does this interaction have no channel? >.< sowwy dont know what to do"
                ),
            ],
            ephemeral: true,
        });
    }

    const collector = interaction.channel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 15 * 1000,
    });

    collector.on("collect", async (buttonInteraction: ButtonInteraction) => {
        if (buttonInteraction.customId === "confirm_uncensorship_purchase") {
            // if someone else clicks the buttons let them know and not just timeout
            if (buttonInteraction.user.id !== interaction.user.id) {
                buttonInteraction.reply({ content: "These buttons aren't for you! 😡", ephemeral: true });
                return;
            }

            if (userBalance < price + noOwnershipSurcharge) {
                buttonInteraction.reply({ content: "You dont have enough coins!", components: [] });
                return;
            }
            await CensorshipUtil.remove(censoredString);
            await updateUser(userId, { angryCoins: userBalance - price - noOwnershipSurcharge });
            await buttonInteraction.reply({
                content: `Purchase confirmed! \n You liberated \`${censoredString}\` from <@${owner}>!`,
                components: [],
            });
        }

        if (buttonInteraction.customId === "cancel_uncensorship_purchase") {
            await buttonInteraction.reply({ content: "Purchase canceled!", components: [] });
        }
    });

    collector.on("end", () => {
        interaction.editReply({ components: [] });
    });

    return interaction.reply({
        embeds: [
            embed.setDescription(
                `<@${owner}> owns \`${censoredString}\`! \n Remove for an additional ${noOwnershipSurcharge} Angry Coins?`
            ),
        ],
        components: [buttonRow],
        ephemeral: true,
    });
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
