import type { CommandHandler } from "@woife5/shared";
import { type ChatInputCommandInteraction, channelMention, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { subscribeDm } from "../database/subscriptions";
import { SUMMARIZABLE_CHANNEL_TYPES } from "./channel-types";

export const autosummary: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("autosummary")
        .setDescription("Receive summaries after discussions in a channel")
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription("The channel to register for")
                .addChannelTypes(...SUMMARIZABLE_CHANNEL_TYPES)
                .setRequired(true),
        ),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const channel = interaction.options.getChannel("channel", true);
        const registered = await subscribeDm(interaction.user.id, channel.id);
        const channelName = channelMention(channel.id);

        const embed = new EmbedBuilder()
            .setColor("White")
            .setAuthor({ name: "Frens" })
            .setDescription(
                registered
                    ? `Successfully registered for summaries of ${channelName}.`
                    : `You are already registered for summaries of ${channelName}.`,
            );

        await interaction.reply({ embeds: [embed] });
    },
};
