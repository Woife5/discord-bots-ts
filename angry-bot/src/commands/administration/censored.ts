import { CommandInteraction, Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { ConfigCache } from "@helpers";
import { ICommand, Role } from "../command-interfaces";

export async function getEmbed() {
    const config = await ConfigCache.get("censored");

    if (!config) {
        return new EmbedBuilder().setColor("#d94d26").setTitle("No consored strings found!");
    }

    let censoredStrings = Array.from(config.keys());
    let censored = "";
    if (censoredStrings.length > 0) {
        censored = "`" + censoredStrings.join("`, `") + "`";
    } else {
        censored = "None";
    }

    //return new EmbedBuilder().setTitle("Censored Strings:").setDescription(JSON.stringify(Object.fromEntries(config)));
    return new EmbedBuilder().setTitle("Censored Strings:").setDescription(censored);
}

export const censored: ICommand = {
    data: new SlashCommandBuilder()
        .setName("censored")
        .setDescription("Get a list of censored strings.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    role: Role.ADMIN,
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        interaction.reply({ embeds: [await getEmbed()] });
    },
    executeMessage: async (message: Message): Promise<void> => {
        message.reply({ embeds: [await getEmbed()] });
    },
};
