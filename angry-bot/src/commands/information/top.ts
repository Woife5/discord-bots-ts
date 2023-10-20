import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import {
    getTopByStat,
    getTopMoneyHoarders,
    getTopSpammers,
    getTopStickerSpammer,
    isUserStatKey,
    TopSpamResult,
} from "helpers/user.util";
import { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { infoEmbedColor } from "../embeds";

const topChoices = [
    {
        name: "Top angry spammer",
        value: "angrySpammer",
    },
    {
        name: "Most angry stickers sent",
        value: "stickerSpammer",
    },
    {
        name: "Most money won in gambling",
        value: "money-won-in-gambling",
    },
    {
        name: "Most money lost in gambling",
        value: "money-lost-in-gambling",
    },
    {
        name: "Most tarots requested",
        value: "tarots-read",
    },
    {
        name: "Most money in the bank",
        value: "money-in-bank",
    },
    {
        name: "Most catgirls requested",
        value: "catgirls-requested",
    },
    {
        name: "Most catboys requested (RIP) :(",
        value: "catboys-requested",
    },
] as const;

type SortByKeys = (typeof topChoices)[number]["value"];

export const top: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("top")
        .setDescription("Get the top 5 users in the provided stat")
        .addStringOption(option =>
            option
                .setName("sort-by")
                .setDescription("The attribute to sort the users by")
                .addChoices(...topChoices)
                .setRequired(true)
        ),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const sortBy = interaction.options.getString("sort-by", true) as SortByKeys;
        interaction.reply({ embeds: [await runCommand(sortBy)] });
    },
};

async function runCommand(sortBy: SortByKeys) {
    const name = topChoices.find(choice => choice.value === sortBy)?.name ?? sortBy;
    if (isUserStatKey(sortBy)) {
        return generateAngrySpammerEmbed(await getTopByStat(sortBy)).setTitle(name);
    }

    if (sortBy === "money-in-bank") {
        return generateAngrySpammerEmbed(await getTopMoneyHoarders()).setTitle(name);
    }

    if (sortBy === "stickerSpammer") {
        return generateAngrySpammerEmbed(await getTopStickerSpammer()).setTitle(name);
    }

    return generateAngrySpammerEmbed(await getTopSpammers()).setTitle(name);
}

function generateAngrySpammerEmbed(users: TopSpamResult[]) {
    const embed = new EmbedBuilder().setTitle("Top Angry Spammers").setColor(infoEmbedColor);
    for (let i = 0; i < 5 && i < users.length; i++) {
        const user = users[i];
        embed.addFields({
            name: `${i + 1}. ${user.userName}`,
            value: `${user.spamCount.toLocaleString("de-AT")}`,
        });
    }

    return embed;
}
