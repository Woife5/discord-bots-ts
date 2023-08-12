import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    SlashCommandBuilder,
} from "discord.js";
import { CommandHandler } from "@woife5/shared/lib/commands/types";
import willhaben from "willhaben";

type WillhabenResult = {
    id: string;
    verticalId: number;
    adTypeId: number;
    productId: number;
    advertStatus: {
        id: string;
        description: string;
        statusId: number;
    };
    description: string;
    selfLink: string;
    location: string;
    heading: string;
    body_dyn: string;
    country: string;
    "price/amount": string;
    all_image_urls: string;
    price: number;
    price_for_display: string;
    published: number;
    enddate: number;
};

const PAGE_SIZE = 5;
const PAGE_AMOUNT = 5;

function isCategory(category: string): boolean {
    return !!willhaben.getCategories[category];
}

export const search: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("search")
        .setDescription("Search for a specific item on willhaben.")
        .addStringOption(option =>
            option.setName("searchterm").setDescription("The search term to search for.").setRequired(true)
        )
        .addStringOption(option =>
            option.setName("category").setDescription("The category to search in.").setRequired(false)
        ),
    executeInteraction: async interaction => {
        const searchTerm = interaction.options.getString("searchterm", true);
        const category = interaction.options.getString("category", false);

        await interaction.deferReply();

        if (category && !isCategory(category)) {
            await interaction.editReply({
                embeds: [
                    defaultEmbed()
                        .setTitle("Unknown category x.x")
                        .setDescription(
                            "Please select one from this list: https://gist.github.com/Woife5/00405ef11eb624ccd70a49cc3ffe480d"
                        ),
                ],
            });
            return;
        }

        let page = 1;
        const results: WillhabenResult[] = await willhaben
            .new()
            .keyword(searchTerm)
            .count(PAGE_SIZE * PAGE_AMOUNT)
            .search();

        const embed = defaultEmbed().addFields(
            results.slice(0, PAGE_SIZE).map(res => ({
                name: res.heading.substring(0, 100),
                value: res.body_dyn.substring(0, 2000),
            }))
        );

        if (!interaction.channel) {
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const nextButton = new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Primary);
        const prevButton = new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Primary);
        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents([prevButton, nextButton]);
        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            componentType: ComponentType.Button,
            time: 60_000,
        });

        collector.on("collect", async i => {
            if (i.customId === "next" && page < PAGE_AMOUNT) {
                page += 1;
            }

            if (i.customId === "prev" && page > 1) {
                page -= 1;
            }

            await i.update({ embeds: [buildEmbed(results, page)] });
        });

        collector.on("end", async () => {
            const expired = defaultEmbed().setDescription("This search has expired.");
            await interaction.editReply({ embeds: [expired], components: [] });
        });

        await interaction.editReply({ embeds: [buildEmbed(results, page)], components: [buttonRow] });
    },
};

function buildEmbed(results: WillhabenResult[], page: number) {
    return defaultEmbed()
        .addFields(
            results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(res => ({
                name: res.heading.substring(0, 100),
                value: res.body_dyn.substring(0, 2000),
            }))
        )
        .setFooter({ text: `Page ${page}/${PAGE_AMOUNT}` });
}

function defaultEmbed() {
    return new EmbedBuilder().setAuthor({
        name: "Willhaben",
        iconURL: "https://static.ots.at/pressemappe/13925/10492.jpg?t=1519747980",
    });
}