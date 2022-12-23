import { prefix } from "@data";
import { SlashCommandBuilder } from "@discordjs/builders";
import { CensorshipUtil } from "@helpers";
import { CommandInteraction, Message, PermissionFlagsBits, User as DiscordUser } from "discord.js";
import { CommandHandler, Role } from "shared/lib/commands/types.d";
import { getCensoredEmbed } from "./censored";

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
    role: Role.ADMIN,
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        const subcommand = (interaction.options.get("action")?.value as "add" | "remove") ?? "add";
        const value = (interaction.options.get("value")?.value as string) ?? "";

        await updateConfig(subcommand, interaction.user, value.toLowerCase().trim());

        await interaction.reply({ embeds: [await getCensoredEmbed()] });
    },
    executeMessage: async (message: Message, args: string[]): Promise<void> => {
        if (args.length < 2) {
            await message.reply("Please provide two arguments! `add` or `remove` and the string to add or remove.");
            return;
        }
        const subcommand = args.shift()?.toLowerCase().trim();
        const censoredString = args.shift()?.toLowerCase().trim();

        if (!censoredString) {
            return;
        }

        if (subcommand === "add" || subcommand === "remove") {
            await updateConfig(subcommand, message.author, censoredString);
            await message.reply({ embeds: [await getCensoredEmbed()] });
        } else {
            await message.reply(
                `Not a valid command. Proper usage would be:\n\`${prefix} censorship <add/remove> string\``
            );
        }
    },
};

async function updateConfig(subcommand: "add" | "remove", discordUser: DiscordUser, value: string) {
    if (subcommand === "add") {
        await CensorshipUtil.add({ value, owner: discordUser.id });
    } else {
        await CensorshipUtil.remove(value);
    }
}
