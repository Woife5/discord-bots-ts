import type { CommandHandler } from "@woife5/shared";
import { type ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, type User } from "discord.js";
import { updateUser } from "helpers/user.util";

export const tarotreminder: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("tarotreminder")
        .setDescription("Enable/disable the tarot reminder.")
        .addStringOption((option) =>
            option
                .setName("action")
                .setDescription("Enable or disable the reminder.")
                .setRequired(true)
                .addChoices({ name: "Enable", value: "enable" }, { name: "Disable", value: "disable" }),
        ),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const action = interaction.options.getString("action", true) as "enable" | "disable";
        await updateReminder(interaction.user, action);
        const embed = new EmbedBuilder().setColor("DarkRed");
        if (action === "enable") {
            interaction.reply({ embeds: [embed.setDescription("Tarot reminder enabled!")] });
        } else {
            interaction.reply({ embeds: [embed.setDescription("Tarot reminder disabled!")] });
        }
    },
};

async function updateReminder(user: User, action: "enable" | "disable") {
    await updateUser(user.id, {
        userName: user.username,
        tarotreminder: action === "enable",
    });
}
