import type { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { getTarget } from "database/boller-target";
import { type ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { defaultEmbed } from "./embeds";

export const currenttarget: CommandHandler = {
    data: new SlashCommandBuilder().setName("currenttarget").setDescription("Get the current target user."),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        let embed: EmbedBuilder;
        try {
            embed = await runCommand();
        } catch (error) {
            console.error("Failed to set target", error);
            embed = new EmbedBuilder()
                .setColor("Red")
                .setDescription("Failed to set/reset target. Please try again later.");
        }

        await interaction.reply({ embeds: [embed] });
    },
};

async function runCommand() {
    const target = await getTarget();
    if (!target) {
        return defaultEmbed().setDescription("There is currently no target user set.");
    }

    return defaultEmbed().setDescription(
        `The current target is <@${target.userId}>. Will join each voice channel the user switches to and only leave after all users leave.`,
    );
}
