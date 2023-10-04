import { GuildSettingsCache } from "@helpers";
import { ChannelType, ChatInputCommandInteraction, Guild, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { adminEmbed } from "../embeds";

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

async function runCommand(message: string, guild: Guild | null) {
    if (!guild) {
        return adminEmbed().setDescription("This command can only be used in a server.");
    }

    const channelId = (await GuildSettingsCache.get(guild.id))?.broadcastChannelId;
    if (!channelId) {
        return adminEmbed().setDescription("For this guild no broadcast channel has been set yet.");
    }

    const channel = await guild.channels.fetch(channelId);
    if (channel?.type !== ChannelType.GuildText) {
        return adminEmbed().setDescription(
            "The set broadcast channel is not a text channel, this should not happen x.x"
        );
    }

    await channel.send(message);

    return adminEmbed().setDescription("The message has been successfuly broadcast.");
}
