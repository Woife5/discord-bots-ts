import { CommandInteraction, Message, User as DiscordUser, PermissionFlagsBits } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { ConfigCache } from "@helpers";
import { prefix } from "@data";
import { getEmbed } from "./censored";
import { ICommand, Role } from "../command-interfaces";

async function updateConfig(subcommand: "add" | "remove", discordUser :DiscordUser, value: string) {
    const config = await ConfigCache.get("censored");

    if (subcommand === "add") {
        if (!config) {
            let newConfig = new Map<string,string>();
            newConfig.set(value, discordUser.id);
            await ConfigCache.set({ key: "censored", value: newConfig });
            return;
        }

        if (config.has(value)) {
            return;
        }

        let newConfig = new Map(config);
        //newConfig = new Map<string,string>();
        newConfig.set(value, discordUser.id);
        await ConfigCache.set({ key: "censored", value: newConfig });
        return;
    }

    if (subcommand === "remove" && config) {
        let newConfig = new Map(config);
        newConfig.delete(value);
        await ConfigCache.set({ key: "censored", value: newConfig });
    }    
}

export const censorship: ICommand = {
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

        await updateConfig(subcommand, interaction.user,value.toLowerCase().trim());

        await interaction.reply({ embeds: [await getEmbed()] });
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
            await message.reply({ embeds: [await getEmbed()] });
        } else {
            await message.reply(
                `Not a valid command. Proper usage would be:\n\`${prefix} censorship <add/remove> string\``
            );
        }
    },
};
