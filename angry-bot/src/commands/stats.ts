import { CommandInteraction, Message, MessageEmbed, User as DiscordUser } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { ICommand } from "./command-interfaces";
import { angryIconCDN } from "@data";
import { getStat, StatKeys, User } from "@helpers";

export const stats: ICommand = {
    data: new SlashCommandBuilder()
        .setName("stats")
        .setDescription("Get stats for the server or about a specific user!")
        .addUserOption(option => option.setName("user").setDescription("The user to get stats for.")),
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        const user = interaction.options.getUser("user");

        let result: MessageEmbed;

        if (user) {
            result = await generateUserStatEmbed(user);
        } else {
            result = await generateStatEmbed();
        }

        await interaction.reply({ embeds: [result] });
    },
    executeMessage: async (message: Message): Promise<void> => {
        const user = message.mentions.users.first();

        let result: MessageEmbed;

        if (user) {
            result = await generateUserStatEmbed(user);
        } else {
            result = await generateStatEmbed();
        }

        await message.reply({ embeds: [result] });
    },
};

async function generateUserStatEmbed(user: DiscordUser) {
    const embed = getStatEmbed().setTitle(`${user.username}'s stats`);

    const userObj = await User.findOne({ userId: user.id });

    if (!userObj) {
        embed.setDescription("No stats have been found for this user!");
        return embed;
    }

    const getStatFromUser = (key: StatKeys) => {
        return (userObj.stats[key] || 0).toString();
    };

    embed.addFields([
        {
            name: "Tarots read",
            value: getStatFromUser("tarots-read"),
        },
        {
            name: "Total Angry emojis sent",
            value: getStatFromUser("total-angry-emojis-sent"),
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

    return embed;
}

async function generateStatEmbed() {
    const embed = getStatEmbed();

    embed.addFields([
        {
            name: "Total angry reactions",
            value: (await getStat("angry-reactions")).toString(),
        },
        {
            name: "Total tarots read",
            value: (await getStat("tarots-read")).toString(),
        },
        {
            name: "Total censored messages",
            value: (await getStat("times-censored")).toString(),
        },
        {
            name: "Total yes/no questions asked",
            value: (await getStat("yesno-questions")).toString(),
        },
        {
            name: "Toal McLuhans enlightenments offered",
            value: (await getStat("mc-luhans")).toString(),
        },
        {
            name: "Total catgirls requested",
            value: (await getStat("catgirls-requested")).toString(),
        },
        {
            name: "Total catboys requested",
            value: (await getStat("catboys-requested")).toString(),
        },
        {
            name: "Total bibleverses read",
            value: (await getStat("bibleverses-requested")).toString(),
        },
        {
            name: "Total money lost in gambling",
            value: (await getStat("money-lost-in-gambling")).toString(),
        },
    ]);

    return embed;
}

function getStatEmbed() {
    return new MessageEmbed().setTitle("Server stats").setColor("GOLD").setAuthor({
        name: "Angry Bot",
        iconURL: angryIconCDN,
    });
}
