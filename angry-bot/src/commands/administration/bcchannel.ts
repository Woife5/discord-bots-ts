import { Message, EmbedBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ChannelType } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { GuildSettingsCache } from "@helpers";
import { ICommand, Role } from "../command-interfaces";
import { version } from "@data";

export const bcchannel: ICommand = {
    data: new SlashCommandBuilder()
        .setName("bcchannel")
        .setDescription("Set the broadcast channel for bot announcements.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName("channel").setDescription("The channel to broadcast to.").setRequired(true)
        ),
    role: Role.ADMIN,
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const channel = interaction.options.getChannel("channel", true);

        if (channel.type !== ChannelType.GuildText) {
            interaction.reply({
                embeds: [embed.setDescription("Only Text-Channels can be used as Broadcast Channels")],
            });
        }

        interaction.reply({ embeds: [await runCommand(interaction.guildId, channel.id)] });
    },
    executeMessage: async (message: Message): Promise<void> => {
        message.reply({ embeds: [await runCommand(message.guildId, message.channelId)] });
    },
};

const embed = new EmbedBuilder()
    .setColor("White")
    .setTitle("Set Broadcast Channel")
    .setFooter({
        text: `Angry Bot v${version}`,
    });

export async function runCommand(guildId: string | null, channelId: string) {
    if (!guildId) {
        return embed.setDescription("This command can only be used in a server.");
    }

    await GuildSettingsCache.set(guildId, { guildId, broadcastChannelId: channelId });

    return embed.setDescription("The broadcast channel has been updated for the current guild.");
}
