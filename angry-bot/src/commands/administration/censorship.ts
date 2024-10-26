import { CensorshipUtil } from "@helpers";
import type { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { clientId } from "@woife5/shared/lib/utils/env.util";
import { type ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getCensoredEmbed } from "../information/censored";

export const censorship: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("censorship")
        .setDescription("Add or remove a string from the permanent censorship list.")
        .addStringOption((option) =>
            option
                .setName("action")
                .setDescription("The action to perform (add/remove)")
                .setRequired(true)
                .addChoices({ name: "Add", value: "add" }, { name: "Remove", value: "remove" }),
        )
        .addStringOption((option) =>
            option.setName("value").setDescription("The value to add or remove.").setRequired(true),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const subcommand = interaction.options.getString("action", true) as "add" | "remove";
        const value = interaction.options.getString("value", true);

        await updateConfig(subcommand, value.toLowerCase().trim());

        await interaction.reply({ embeds: [await getCensoredEmbed()] });
    },
};

async function updateConfig(subcommand: "add" | "remove", value: string) {
    if (subcommand === "add") {
        await CensorshipUtil.add({ value, owner: clientId });
    } else {
        await CensorshipUtil.remove(value);
    }
}
