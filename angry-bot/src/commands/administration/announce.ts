import { version } from "@data";
import { SlashCommandBuilder } from "@discordjs/builders";
import { GuildSettingsCache } from "@helpers";
import { ChannelType, ChatInputCommandInteraction, EmbedBuilder, Guild, PermissionFlagsBits } from "discord.js";
import { CommandHandler } from "shared/lib/commands/types.d";

export const announce: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("announce")
        .setDescription("Announce someting in a guild's broadcast channel.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName("message").setDescription("The message to announce.").setRequired(true)
        ),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const message = interaction.options.getString("message") ?? "";
        interaction.reply({ embeds: [await runCommand(message, interaction.guild)] });
    },
};

const embed = () => {
    return new EmbedBuilder()
        .setColor("White")
        .setTitle("Announcement")
        .setFooter({
            text: `Angry Bot v${version}`,
        });
};

async function runCommand(message: string, guild: Guild | null) {
    if (!guild) {
        return embed().setDescription("This command can only be used in a server.");
    }

    const channelId = (await GuildSettingsCache.get(guild.id))?.broadcastChannelId;
    if (!channelId) {
        return embed().setDescription("For this guild no broadcast channel has been set yet.");
    }

    const channel = await guild.channels.fetch(channelId);
    if (channel?.type !== ChannelType.GuildText) {
        return embed().setDescription("The set broadcast channel is not a text channel, this should not happen x.x");
    }

    await channel.send(message);

    return embed().setDescription("The message has been successfuly broadcast.");
}
