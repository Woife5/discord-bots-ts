import { angryIconCDN, repoURL } from "@data";
import { SlashCommandBuilder } from "@discordjs/builders";
import { getStat, StatKeys } from "@helpers";
import { ChatInputCommandInteraction, EmbedBuilder, User as DiscordUser } from "discord.js";
import { getUser } from "helpers/user.util";
import { CommandHandler } from "shared/lib/commands/types.d";

export const stats: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("stats")
        .setDescription("Get stats for the server or about a specific user!")
        .addUserOption(option => option.setName("user").setDescription("The user to get stats for.")),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const user = interaction.options.getUser("user");

        let result: EmbedBuilder;

        if (user) {
            result = await generateUserStatEmbed(user);
        } else {
            result = await generateStatEmbed();
        }

        await interaction.reply({ embeds: [result] });
    },
};

async function generateUserStatEmbed(user: DiscordUser) {
    const embed = defaultEmbed().setTitle(`${user.username}'s stats`);

    const userObj = await getUser(user.id);

    if (!userObj) {
        return embed.setDescription("No stats have been found for this user!");
    }

    const getStatFromUser = (key: StatKeys) => {
        return (userObj.stats[key] || 0).toLocaleString("de-AT");
    };

    return embed.addFields([
        {
            name: "Tarots read",
            value: getStatFromUser("tarots-read"),
        },
        {
            name: "Total Angry emojis sent",
            value: Object.values(userObj.emojis)
                .reduce((a, b) => a + b, 0)
                .toLocaleString("de-AT"),
        },
        {
            name: "Questions asked",
            value: getStatFromUser("yesno-questions"),
        },
        {
            name: "McLuhans enlightenments recieved",
            value: getStatFromUser("mc-luhans"),
        },
        {
            name: "Catgirls requested",
            value: getStatFromUser("catgirls-requested"),
        },
        {
            name: "Catboys requested",
            value: getStatFromUser("catboys-requested"),
        },
        {
            name: "Bibleverses read",
            value: getStatFromUser("bibleverses-requested"),
        },
        {
            name: "Money 'invested' in gambling",
            value: getStatFromUser("money-lost-in-gambling"),
        },
    ]);
}

async function generateStatEmbed() {
    return defaultEmbed().addFields([
        {
            name: "Total angry reactions",
            value: (await getStat("angry-reactions")).toLocaleString("de-AT"),
        },
        {
            name: "Total angry emojis sent",
            value: (await getStat("total-angry-emojis-sent")).toLocaleString("de-AT"),
        },
        {
            name: "Total tarots read",
            value: (await getStat("tarots-read")).toLocaleString("de-AT"),
        },
        {
            name: "Total censored messages",
            value: (await getStat("times-censored")).toLocaleString("de-AT"),
        },
        {
            name: "Total yes/no questions asked",
            value: (await getStat("yesno-questions")).toLocaleString("de-AT"),
        },
        {
            name: "Toal McLuhans enlightenments offered",
            value: (await getStat("mc-luhans")).toLocaleString("de-AT"),
        },
        {
            name: "Total catgirls requested",
            value: (await getStat("catgirls-requested")).toLocaleString("de-AT"),
        },
        {
            name: "Total catboys requested",
            value: (await getStat("catboys-requested")).toLocaleString("de-AT"),
        },
        {
            name: "Total bibleverses read",
            value: (await getStat("bibleverses-requested")).toLocaleString("de-AT"),
        },
        {
            name: "Total money lost in gambling",
            value: (await getStat("money-lost-in-gambling")).toLocaleString("de-AT"),
        },
    ]);
}

const defaultEmbed = () =>
    new EmbedBuilder().setTitle("Server stats").setColor("Gold").setAuthor({
        name: "Angry Bot",
        iconURL: angryIconCDN,
        url: repoURL,
    });