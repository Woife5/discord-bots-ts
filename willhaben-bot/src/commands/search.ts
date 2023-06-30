import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { CommandHandler } from "shared/lib/commands/types";
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

console.log(willhaben.new().keyword("test").getURL());
process.exit(0);

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

        if (category && !isCategory(category)) {
            await interaction.reply({
                embeds: [defaultEmbed().setDescription("Invalid category. Please select a valid one from here: ")],
            });
            return;
        }

        const results: WillhabenResult[] = await willhaben.new().keyword(searchTerm).count(5).search();
        const embed = defaultEmbed().addFields(
            results.map(res => ({
                name: res.heading.substring(0, 100),
                value: res.body_dyn.substring(0, 2000),
            }))
        );

        await interaction.reply({ embeds: [embed] });
    },
};

function defaultEmbed() {
    return new EmbedBuilder().setAuthor({
        name: "Willhaben",
        iconURL: "https://static.ots.at/pressemappe/13925/10492.jpg?t=1519747980",
    });
}
