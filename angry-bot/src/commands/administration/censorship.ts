import { SlashCommandBuilder } from "@discordjs/builders";
import { CensorshipUtil } from "@helpers";
import { ChatInputCommandInteraction, PermissionFlagsBits, User as DiscordUser } from "discord.js";
import { CommandHandler } from "shared/lib/commands/types.d";
import { getCensoredEmbed } from "../information/censored";

export const censorship: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("censorship")
        .setDescription("Add or remove a string from the censorship list.")
        .addStringOption(option =>
            option
                .setName("action")
                .setDescription("The action to perform (add/remove)")
                .setRequired(true)
                .addChoices({ name: "Add", value: "add" }, { name: "Remove", value: "remove" })
        )
        .addStringOption(option =>
            option.setName("value").setDescription("The value to add or remove.").setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const subcommand = (interaction.options.get("action")?.value as "add" | "remove") ?? "add";
        const value = (interaction.options.get("value")?.value as string) ?? "";

        await updateConfig(subcommand, interaction.user, value.toLowerCase().trim());

        await interaction.reply({ embeds: [await getCensoredEmbed()] });
    },
};

async function updateConfig(subcommand: "add" | "remove", discordUser: DiscordUser, value: string) {
    if (subcommand === "add") {
        await CensorshipUtil.add({ value, owner: discordUser.id });
    } else {
        await CensorshipUtil.remove(value);
    }
}
