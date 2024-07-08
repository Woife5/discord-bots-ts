import { GuildSettingsCache } from "@helpers";
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { adminId } from "@woife5/shared/lib/utils/env.util";
import { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { adminEmbed } from "../embeds";

export const adminrole: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("adminrole")
        .setDescription("Set the admin role for the current guild.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(option =>
            option.setName("role").setDescription("The role which sould have admin rights to the bot").setRequired(true),
        ),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const role = interaction.options.getRole("role", true);

        if (interaction.user.id !== adminId) {
            interaction.reply({ content: "You don't have permission to do this!", ephemeral: true });
            return;
        }

        interaction.reply({ embeds: [await runCommand(interaction.guildId, role.id)] });
    },
};

async function runCommand(guildId: string | null, adminRoleId: string) {
    if (!guildId) {
        return adminEmbed().setDescription("This command can only be used in a server.");
    }

    await GuildSettingsCache.set(guildId, { adminRoleId: adminRoleId });
    return adminEmbed().setDescription("The admin role for the current server has been updated.");
}
