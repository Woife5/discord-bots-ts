import type { CommandHandler } from "@woife5/shared";
import {
    type ChatInputCommandInteraction,
    channelMention,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";
import { unsubscribeChannelDaily } from "../database/subscriptions";
import { POSTABLE_CHANNEL_TYPES } from "./channel-types";

export const stopchannelsummary: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("stopchannelsummary")
        .setDescription("Stop the daily summary of a channel")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription("The channel to stop summarizing daily")
                .addChannelTypes(...POSTABLE_CHANNEL_TYPES)
                .setRequired(true),
        ),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const channel = interaction.options.getChannel("channel", true);
        const unsubscribed = await unsubscribeChannelDaily(channel.id);
        const channelName = channelMention(channel.id);

        const embed = new EmbedBuilder()
            .setColor("White")
            .setAuthor({ name: "Frens" })
            .setDescription(
                unsubscribed
                    ? `Stopped the daily summary of ${channelName}.`
                    : `${channelName} has no daily summary configured.`,
            );

        await interaction.reply({ embeds: [embed] });
    },
};
