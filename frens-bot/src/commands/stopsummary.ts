import type { CommandHandler } from "@woife5/shared";
import { type ChatInputCommandInteraction, channelMention, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { unsubscribeDm } from "../database/subscriptions";
import { SUMMARIZABLE_CHANNEL_TYPES } from "./channel-types";

export const stopsummary: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("stopsummary")
        .setDescription("Stop receiving summaries for a channel")
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription("The channel to stop receiving summaries for")
                .addChannelTypes(...SUMMARIZABLE_CHANNEL_TYPES)
                .setRequired(true),
        ),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const channel = interaction.options.getChannel("channel", true);
        const unregistered = await unsubscribeDm(interaction.user.id, channel.id);
        const channelName = channelMention(channel.id);

        const embed = new EmbedBuilder()
            .setColor("White")
            .setAuthor({ name: "Frens" })
            .setDescription(
                unregistered
                    ? `Successfully stopped summaries of ${channelName}.`
                    : `You were not registered for summaries of ${channelName}.`,
            );

        await interaction.reply({ embeds: [embed] });
    },
};
