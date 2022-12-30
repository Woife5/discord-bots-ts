import { angryIconCDN, repoURL, version } from "@data";
import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction, EmbedBuilder, User as DiscordUser } from "discord.js";
import { getUser } from "helpers/user.util";
import { CommandHandler } from "shared/lib/commands/types.d";

export const about: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("about")
        .setDescription("Get information about the bot or, if provieded, about the given user.")
        .addUserOption(option => option.setName("user").setDescription("The user to get information about.")),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const user = interaction.options.getUser("user");
        if (!user) {
            interaction.reply({ embeds: [aboutBot()] });
        } else {
            interaction.reply({ embeds: [await aboutUser(user)], ephemeral: true });
        }
    },
};

const defaultEmbed = () => {
    return new EmbedBuilder().setColor("#d94d26").setTitle("About");
};

async function aboutUser(discordUser: DiscordUser) {
    const user = await getUser(discordUser.id);

    const embed = defaultEmbed().setTitle(discordUser.username);
    if (!user) {
        return embed.setDescription("Sorry, I have no information about that user.");
    }

    embed.addFields({
        name: "Balance",
        value: `${user.userName} currently has ${user.angryCoins.toLocaleString("de-AT")} angry coins.`,
    });

    const powers = Object.entries(user.powers);
    if (powers.length > 0) {
        embed.addFields({
            name: "User powers",
            value: powers.map(([power, amount]) => `${amount.toLocaleString("de-AT")}x \`${power}\``).join("\n"),
        });
    }

    return embed;
}

function aboutBot() {
    return defaultEmbed()
        .addFields([
            {
                name: "Slash Command",
                value: "I **only** use slash commands now. Just browse them by typing `/`.",
            },
        ])
        .setAuthor({
            name: "Angry",
            iconURL: angryIconCDN,
            url: repoURL,
        })
        .setFooter({
            text: `Angry Bot v${version}`,
        });
}
