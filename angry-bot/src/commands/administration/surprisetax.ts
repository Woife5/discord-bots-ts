import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { broadcast, tax } from "plugins/taxation";
import { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { adminEmbed } from "../embeds";

export const surprisetax: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("surprisetax")
        .setDescription("Surprise tax for everyone :D")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const result = await tax();
        await broadcast(
            interaction.client,
            result.taxMoney,
            result.taxedUsers,
            "Thank you for your surprise donation \\:D"
        );
        interaction.reply({ embeds: [adminEmbed().setDescription("Executed command :D")] });
    },
};
