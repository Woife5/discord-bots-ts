import type { CommandHandler } from "@woife5/shared";
import {
    type ChatInputCommandInteraction,
    channelMention,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";
import { subscribeChannelDaily } from "../database/subscriptions";
import { POSTABLE_CHANNEL_TYPES } from "./channel-types";

export const channelsummary: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("channelsummary")
        .setDescription("Post a daily summary of a channel's discussions into the channel at 20:00")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription("The channel to summarize daily")
                .addChannelTypes(...POSTABLE_CHANNEL_TYPES)
                .setRequired(true),
        ),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const channel = interaction.options.getChannel("channel", true);

        if (!interaction.guildId) {
            await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
            return;
        }

        const subscribed = await subscribeChannelDaily(channel.id, interaction.guildId);
        const channelName = channelMention(channel.id);

        const embed = new EmbedBuilder()
            .setColor("White")
            .setAuthor({ name: "Frens" })
            .setDescription(
                subscribed
                    ? `${channelName} will now receive a daily summary at 20:00.`
                    : `${channelName} already receives a daily summary.`,
            );

        await interaction.reply({ embeds: [embed] });
    },
};
