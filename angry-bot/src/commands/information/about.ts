import { SlashCommandBuilder } from "@discordjs/builders";
import { GuildSettingsCache } from "@helpers";
import { infoEmbed } from "commands/embeds";
import { ChatInputCommandInteraction, Guild, User as DiscordUser } from "discord.js";
import { getUser, getUserActionCache } from "helpers/user.util";
import { CommandHandler } from "@woife5/shared/lib/commands/types.d";

export const about: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("about")
        .setDescription("Get information about the bot or, if provieded, about the given user.")
        .addUserOption(option => option.setName("user").setDescription("The user to get information about.")),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const user = interaction.options.getUser("user");
        if (!user) {
            if (interaction.guild) {
                interaction.reply({ embeds: [await aboutGuild(interaction.guild)] });
            } else {
                interaction.reply({ embeds: [aboutBot()] });
            }
        } else {
            interaction.reply({ embeds: [await aboutUser(user)], ephemeral: true });
        }
    },
};

async function aboutUser(discordUser: DiscordUser) {
    const user = await getUser(discordUser.id);

    const embed = infoEmbed().setTitle(discordUser.username);
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

    const userCache = getUserActionCache(discordUser.id);
    if (userCache != undefined) {
        const cash = Math.min(100, userCache.emojiCash ?? 0);
        embed.addFields({
            name: "Emoji cash",
            value: `${100 - cash} more money can be earned by spamming emojis today.`,
        });

        embed.addFields({
            name: "Feet cash",
            value: userCache.feetCash
                ? "No more cache availabe for sending feetpics/feetvids."
                : "Feet cash is still available today!",
        });
    } else {
        embed.addFields({
            name: "Daily actions",
            value: "All daily actions to gain cash are still available!",
        });
    }

    return embed;
}

function aboutBot() {
    return infoEmbed().addFields([
        {
            name: "Slash Command",
            value: "I **only** use slash commands now. Just browse them by typing `/`.",
        },
    ]);
}

async function aboutGuild(guild: Guild) {
    const guildSettings = await GuildSettingsCache.get(guild.id);

    if (!guildSettings) {
        return aboutBot();
    }

    return infoEmbed()
        .setDescription(`Settings for **${guild.name}**:`)
        .addFields([
            {
                name: "Admin role",
                value: guildSettings.adminRoleId
                    ? `<@&${guildSettings.adminRoleId}>`
                    : "Set up an adminrole with `/adminrole`.",
            },
            {
                name: "Broadcast channel",
                value: guildSettings.broadcastChannelId
                    ? `<#${guildSettings.broadcastChannelId}>`
                    : "Set up a broadcast channel with `/bcchannel`.",
            },
        ]);
}
