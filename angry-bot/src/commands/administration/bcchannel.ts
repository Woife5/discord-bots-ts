import { version } from "@data";
import { SlashCommandBuilder } from "@discordjs/builders";
import { GuildSettingsCache } from "@helpers";
import { ChannelType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { CommandHandler } from "shared/lib/commands/types.d";

export const bcchannel: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("bcchannel")
        .setDescription("Set the broadcast channel for bot announcements.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName("channel").setDescription("The channel to broadcast to.").setRequired(true)
        ),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const channel = interaction.options.getChannel("channel", true);

        if (channel.type !== ChannelType.GuildText) {
            interaction.reply({
                embeds: [embed().setDescription("Only Text-Channels can be used as Broadcast Channels")],
            });
        }

        interaction.reply({ embeds: [await runCommand(interaction.guildId, channel.id)] });
    },
};

const embed = () => {
    return new EmbedBuilder()
        .setColor("White")
        .setTitle("Set Broadcast Channel")
        .setFooter({
            text: `Angry Bot v${version}`,
        });
};

async function runCommand(guildId: string | null, channelId: string) {
    if (!guildId) {
        return embed().setDescription("This command can only be used in a server.");
    }

    await GuildSettingsCache.set(guildId, { guildId, broadcastChannelId: channelId });
    return embed().setDescription("The broadcast channel has been updated for the current guild.");
}
