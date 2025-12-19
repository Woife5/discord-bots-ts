import type { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { adminId } from "@woife5/shared/lib/utils/env.util";
import { resetTarget, setTarget } from "database/boller-target";
import { type ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, type User } from "discord.js";
import { defaultEmbed } from "./embeds";

export const target: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("target")
        .setDescription("Set a target user. If no user is provided, the first user per guild will be joined after.")
        .addUserOption((option) => option.setName("user").setDescription("The user to set as target")),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const user = interaction.options.getUser("user");

        if (interaction.user.id !== adminId) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder().setColor("Red").setDescription("Only the bot admin can set a target user."),
                ],
                ephemeral: true,
            });
            return;
        }

        await interaction.reply({ embeds: [await runCommand(user)] });
    },
};

async function runCommand(user: User | null) {
    if (!user) {
        try {
            await resetTarget();
            return defaultEmbed().setDescription(
                "Target has been reset. The first user per server will be joined after and bollered! :D After the last user leaves, the bot will also leave the channel.",
            );
        } catch (_) {
            return new EmbedBuilder().setColor("Red").setDescription("Failed to reset target. Please try again later.");
        }
    }

    try {
        await setTarget({ userId: user.id, userName: user.username });
        return defaultEmbed().setDescription(
            `Set the target user to <@${user.id}>. Will join each voice channel the user switches to and only leave after all users leave.`,
        );
    } catch (_) {
        return new EmbedBuilder().setColor("Red").setDescription("Failed to reset target. Please try again later.");
    }
}
