import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    SlashCommandBuilder,
} from "discord.js";
import { CommandHandler } from "@woife5/shared/lib/commands/types";
import { type WillhabenResult, isCategory, PagedFinder } from "@willhaben";

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

        const pagedResults = new PagedFinder();
        await pagedResults.find(searchTerm, category);

        if (pagedResults.pages === 0) {
            interaction.editReply({
                embeds: [
                    defaultEmbed()
                        .setTitle("No results found :(")
                        .setDescription("Try again with a different search term."),
                ],
            });
            return;
        }

        if (!interaction.channel) {
            const embed = defaultEmbed().addFields(
                pagedResults.nextPage().map(res => ({
                    name: res.heading.substring(0, 100),
                    value: res.body_dyn.substring(0, 2000),
                }))
            );
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const nextButton = new ButtonBuilder()
            .setCustomId("next")
            .setLabel("➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!pagedResults.hasNextPage());
        const prevButton = new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("⬅️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!pagedResults.hasPrevPage());

        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents([prevButton, nextButton]);
        const collector = interaction.channel.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60_000,
        });

        collector.on("collect", async i => {
            let data: WillhabenResult[];
            if (i.customId === "next") {
                data = pagedResults.nextPage();
            } else {
                data = pagedResults.prevPage();
            }

            if (!pagedResults.hasNextPage()) {
                nextButton.setDisabled(true);
            } else {
                nextButton.setDisabled(false);
            }

            if (!pagedResults.hasPrevPage()) {
                prevButton.setDisabled(true);
            } else {
                prevButton.setDisabled(false);
            }

            await i.update({
                embeds: [buildEmbed(data, pagedResults.page, pagedResults.pages)],
                components: [buttonRow],
            });

            // maybe?
            // collector.resetTimer();
        });

        collector.on("end", async () => {
            const expired = defaultEmbed().setDescription("This search has expired.");
            await interaction.editReply({ embeds: [expired], components: [] });
        });

        await interaction.editReply({
            embeds: [buildEmbed(pagedResults.nextPage(), pagedResults.page, pagedResults.pages)],
            components: [buttonRow],
        });
    },
};

function buildEmbed(results: WillhabenResult[], page: number, pages: number) {
    return defaultEmbed()
        .addFields(
            results.map(res => ({
                name: res.heading.substring(0, 100),
                value: res.body_dyn.substring(0, 1500) + `\n[Link](https://willhaben.at/iad/${res.seo_url})\n`,
            }))
        )
        .setFooter({ text: `Page ${page}/${pages}` });
}

function defaultEmbed() {
    return new EmbedBuilder().setAuthor({
        name: "Willhaben",
        iconURL: "https://static.ots.at/pressemappe/13925/10492.jpg?t=1519747980",
    });
}
