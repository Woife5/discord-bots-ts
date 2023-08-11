import { uncensorable } from "@data";
import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CensorshipUtil, Powers } from "@helpers";
import { angryCoinEmbed } from "commands/embeds";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
} from "discord.js";
import { clientId } from "@woife5/shared/lib/utils/env.util";
import { getPowerUpdate, getUserBalance, isUserPower, updateUser, updateUserBalance } from "helpers/user.util";
import { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { hasEmoji, toCleanLowerCase } from "@woife5/shared/lib/utils/string.util";

type CensorshipItem = "censorship" | "un-censorship";

type ShopItem = {
    name: Powers | CensorshipItem;
    description: string;
    price: number;
    addOptions: (subcommand: SlashCommandSubcommandBuilder) => SlashCommandSubcommandBuilder;
};

const amountOption = (subcommand: SlashCommandSubcommandBuilder) => {
    return subcommand.addIntegerOption(option =>
        option.setName("amount").setDescription("The amount of this item you would like to buy.").setRequired(false)
    );
};

const messageOption = (subcommand: SlashCommandSubcommandBuilder, description: string) => {
    return subcommand.addStringOption(option =>
        option.setName("message").setDescription(description).setRequired(true).setMaxLength(100)
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
            return messageOption(subcommand, "The censored string to be censored.");
        },
    },
    {
        name: "un-censorship",
        description: "Un-censor something you like again! 🥰",
        price: 500,
        addOptions: (subcommand: SlashCommandSubcommandBuilder) => {
            return messageOption(subcommand, "The censored string to be freed.");
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

export const buy: CommandHandler = {
    data,
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const item = interaction.options.getSubcommand();
        const shopItem = shopItems.find(i => i.name === item);
        if (!shopItem) {
            await interaction.reply({ embeds: [shopEmbed] });
            return;
        }

        const userBalance = await getUserBalance(interaction.user.id);
        if (userBalance < shopItem.price) {
            interaction.reply({
                embeds: [angryCoinEmbed().setDescription("You don't have enough angry coins to buy this item.")],
                ephemeral: true,
            });
            return;
        }

        if (isUserPower(shopItem.name)) {
            await buyUserPower(interaction, shopItem);
        }

        if (isCensorshipItem(shopItem.name)) {
            await censorshipPurchase(interaction, shopItem);
        }
    },
};

function isCensorshipItem(item: string): item is CensorshipItem {
    return item === "censorship" || item === "un-censorship";
}

async function buyUserPower(interaction: ChatInputCommandInteraction, shopItem: ShopItem) {
    const amount = interaction.options.getInteger("amount") ?? 1;
    const userId = interaction.user.id;

    const update = await getPowerUpdate(userId, shopItem.name as Powers, amount);
    update.angryCoins -= shopItem.price * amount;
    await updateUser(userId, update);
    await updateUserBalance({
        userId: clientId,
        amount: shopItem.price * amount,
        username: "Angry",
    });

    return interaction.reply({
        embeds: [
            angryCoinEmbed().setTitle("Purchase successful").setDescription(`You bought ${amount} ${shopItem.name}.`),
        ],
    });
}

async function censorshipPurchase(interaction: ChatInputCommandInteraction, shopItem: ShopItem) {
    const userId = interaction.user.id;
    const message = interaction.options.getString("message") ?? "";
    const censoredString = toCleanLowerCase(message);

    const priceModifier = await CensorshipUtil.getPriceModifier(censoredString);
    const price = shopItem.price * priceModifier;

    if (price > (await getUserBalance(userId))) {
        return interaction.reply({
            embeds: [
                angryCoinEmbed().setDescription(
                    `Sorry, this string is quite hot 🔥🔥🔥🔥 You can't afford it. :( It would cost \`${price}\` angry coins.`
                ),
            ],
        });
    }

    if (shopItem.name === "censorship") {
        if (censoredString.length < 4 && !hasEmoji(censoredString)) {
            return interaction.reply({
                embeds: [
                    angryCoinEmbed().setDescription(
                        "This string is too short for censorship! 😟 \n Enter at least 4 charcters or an emoji."
                    ),
                ],
                ephemeral: true,
            });
        }

        if (uncensorable.some(regex => regex.test(censoredString))) {
            return interaction.reply({
                embeds: [angryCoinEmbed().setDescription("Sorry this string is forbidden from censoring 😨")],
                ephemeral: true,
            });
        }

        if (await CensorshipUtil.isCensored(censoredString)) {
            return interaction.reply({
                embeds: [angryCoinEmbed().setDescription("This string is already censored!")],
                ephemeral: true,
            });
        }

        await CensorshipUtil.add({ owner: userId, value: censoredString });
        await payBot(userId, price);

        return interaction.reply({
            embeds: [
                angryCoinEmbed().setTitle("Purchase successful").setDescription(`You bought \`${censoredString}\`!`),
            ],
        });
    }

    // handle un-censorship
    const owner = await CensorshipUtil.findOwner(censoredString);
    if (owner == null) {
        return interaction.reply({
            embeds: [angryCoinEmbed().setDescription("This string is not censored.")],
            ephemeral: true,
        });
    }

    if (owner === clientId) {
        return interaction.reply({
            embeds: [angryCoinEmbed().setDescription("I'm sorry, this one is mine.")],
            ephemeral: true,
        });
    }

    const userBalance = await getUserBalance(userId);
    if (owner === userId) {
        await CensorshipUtil.remove(censoredString);
        await payBot(userId, price);
        return interaction.reply({
            embeds: [
                angryCoinEmbed().setTitle("Purchase successful").setDescription(`You liberated \`${censoredString}\`!`),
            ],
        });
    }

    const noOwnershipSurcharge = 300;
    const surchargeButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("confirm_uncensorship_purchase").setEmoji("😍").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("cancel_uncensorship_purchase").setEmoji("🤮").setStyle(ButtonStyle.Danger)
    );

    if (!interaction.channel) {
        return interaction.reply({
            embeds: [angryCoinEmbed().setDescription("Please only use this command in a guild")],
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
            collector.stop();

            if (userBalance < price + noOwnershipSurcharge) {
                await buttonInteraction.reply({
                    embeds: [
                        angryCoinEmbed().setDescription(
                            `You don't have enough coins, the base price of this item is \`${price}\` coins!`
                        ),
                    ],
                    components: [],
                    ephemeral: true,
                });
                return;
            }
            await CensorshipUtil.remove(censoredString);
            await updateUserBalance({ userId, amount: -(price + noOwnershipSurcharge) });
            await updateUserBalance({ userId: clientId, amount: price + 0.25 * noOwnershipSurcharge });
            await updateUserBalance({ userId: owner, amount: 0.75 * noOwnershipSurcharge });
            await buttonInteraction.reply({
                embeds: [
                    angryCoinEmbed().setDescription(
                        `Purchase confirmed! \n You liberated \`${censoredString}\` from <@${owner}> and payed them ${
                            0.75 * noOwnershipSurcharge
                        } coins excluding 25% VAT.`
                    ),
                ],
                components: [],
            });
        }

        if (buttonInteraction.customId === "cancel_uncensorship_purchase") {
            collector.stop();
            await buttonInteraction.reply({
                embeds: [angryCoinEmbed().setDescription("Purchase canceled!")],
                components: [],
                ephemeral: true,
            });
        }
    });

    collector.on("end", () => {
        interaction.editReply({ components: [] });
    });

    interaction.reply({
        embeds: [
            angryCoinEmbed().setDescription(
                `<@${owner}> owns \`${censoredString}\`! \n Remove for an additional ${noOwnershipSurcharge} Angry Coins?`
            ),
        ],
        components: [surchargeButtons],
        ephemeral: true,
    });
}

async function payBot(userId: string, price: number) {
    await updateUserBalance({ userId, amount: -price });
    await updateUserBalance({ userId: clientId, amount: price, username: "Angry" });
}

const shopEmbed = angryCoinEmbed()
    .setTitle("Shop Items")
    .addFields(
        shopItems.map(item => ({
            name: item.name,
            value: `\`${item.name}\`: ${item.description} (${item.price} angry coins)`,
        }))
    );
