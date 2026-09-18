import { isCategory, PagedFinder, type WillhabenResult } from "@willhaben";
import type { CommandHandler } from "@woife5/shared";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    SlashCommandBuilder,
} from "discord.js";

export const search: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("search")
        .setDescription("Search for a specific item on willhaben.")
        .addStringOption((option) =>
            option.setName("searchterm").setDescription("The search term to search for.").setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("category").setDescription("The category to search in.").setRequired(false),
        ),
    executeInteraction: async (interaction) => {
        const searchTerm = interaction.options.getString("searchterm", true);
        const category = interaction.options.getString("category", false);

        await interaction.deferReply();

        if (category && !isCategory(category)) {
            await interaction.editReply({
                embeds: [
                    defaultEmbed()
                        .setTitle("Unknown category x.x")
                        .setDescription(
                            "Please select one from this list: https://gist.github.com/Woife5/00405ef11eb624ccd70a49cc3ffe480d",
                        ),
                ],
            });
            return;
        }

        const pagedResults = new PagedFinder();
        try {
            await pagedResults.find(searchTerm, category);
        } catch (error) {
            console.error("Willhaben search failed:", error);
            await interaction.editReply({
                embeds: [
                    defaultEmbed()
                        .setTitle("Search unavailable")
                        .setDescription("Willhaben did not return results. Please try again later."),
                ],
            });
            return;
        }

        if (pagedResults.pages === 0) {
            await interaction.editReply({
                embeds: [
                    defaultEmbed()
                        .setTitle("No results found :(")
                        .setDescription("Try again with a different search term."),
                ],
            });
            return;
        }

        if (!interaction.channel?.isSendable()) {
            // No pagination possible here, so show the first page as a static embed.
            const embed = buildEmbed(pagedResults.getCurrentPage(), pagedResults.page, pagedResults.pages);
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const nextButtonId = `willhaben:${interaction.id}:next`;
        const prevButtonId = `willhaben:${interaction.id}:prev`;
        const nextButton = new ButtonBuilder()
            .setCustomId(nextButtonId)
            .setLabel("➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!pagedResults.hasNextPage());
        const prevButton = new ButtonBuilder()
            .setCustomId(prevButtonId)
            .setLabel("⬅️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!pagedResults.hasPrevPage());

        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents([prevButton, nextButton]);
        const response = await interaction.editReply({
            embeds: [buildEmbed(pagedResults.getCurrentPage(), pagedResults.page, pagedResults.pages)],
            components: [buttonRow],
        });
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60_000,
            filter: (i) => i.customId === nextButtonId || i.customId === prevButtonId,
        });

        collector.on("collect", async (i) => {
            if (i.user.id !== interaction.user.id) {
                await i.reply({ content: "These buttons are not for you.", ephemeral: true });
                return;
            }

            let data: WillhabenResult[];
            if (i.customId === nextButtonId) {
                data = pagedResults.nextPage();
            } else {
                data = pagedResults.prevPage();
            }

            nextButton.setDisabled(!pagedResults.hasNextPage());
            prevButton.setDisabled(!pagedResults.hasPrevPage());

            await i.update({
                embeds: [buildEmbed(data, pagedResults.page, pagedResults.pages)],
                components: [buttonRow],
            });
        });

        collector.on("end", async () => {
            const expired = defaultEmbed().setDescription("This search has expired.");
            await interaction.editReply({ embeds: [expired], components: [] });
        });
    },
};

/** Discord rejects embed field names longer than this. */
const FIELD_NAME_LIMIT = 100;
/** Discord rejects embed field values longer than this. */
const FIELD_VALUE_LIMIT = 1024;
/**
 * Discord rejects embeds whose combined text exceeds 6000 characters. Budget a conservative
 * share of that per field so a full page of long listings cannot push the embed over.
 */
const EMBED_TOTAL_LIMIT = 6000;

function buildField(res: WillhabenResult, valueBudget: number) {
    const link = `\n[Link](https://willhaben.at/iad/${res.seo_url})\n`;
    // The link must always survive, so the description gets whatever budget is left over.
    const bodyBudget = Math.max(0, Math.min(FIELD_VALUE_LIMIT, valueBudget) - link.length);

    return {
        name: res.heading.substring(0, FIELD_NAME_LIMIT),
        // The final cap also covers an absurdly long seo_url, where the link alone would
        // overflow the field. Truncating it breaks the markdown, but the alternative is
        // `addFields` throwing and taking the whole command down.
        value: `${res.body_dyn.substring(0, bodyBudget)}${link}`.substring(0, FIELD_VALUE_LIMIT),
    };
}

function buildEmbed(results: WillhabenResult[], page: number, pages: number) {
    const footer = `Page ${page}/${pages}`;
    const namesLength = results.reduce((sum, res) => sum + Math.min(res.heading.length, FIELD_NAME_LIMIT), 0);
    const overhead = namesLength + footer.length + AUTHOR_NAME.length;
    const valueBudget = Math.floor((EMBED_TOTAL_LIMIT - overhead) / Math.max(1, results.length));

    return defaultEmbed()
        .addFields(results.map((res) => buildField(res, valueBudget)))
        .setFooter({ text: footer });
}

const AUTHOR_NAME = "Willhaben";

function defaultEmbed() {
    return new EmbedBuilder().setAuthor({
        name: AUTHOR_NAME,
        iconURL: "https://static.ots.at/pressemappe/13925/10492.jpg?t=1519747980",
    });
}
