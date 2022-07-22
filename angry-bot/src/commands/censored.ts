import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { ConfigCache } from "@helpers";

export async function getEmbed() {
    const config = await ConfigCache.get("censored");

    if (!config) {
        return new MessageEmbed().setColor("#d94d26").setTitle("No consored strings found!");
    }

    let censored = "";
    if (config.length > 0) {
        censored = "`" + config.join("`, `") + "`";
    } else {
        censored = "None";
    }

    return new MessageEmbed().setTitle("Censored Strings:").setDescription(censored);
}

export const name = "censored";

export const slashCommandData = new SlashCommandBuilder()
    .setName(name)
    .setDescription("Find out which emojis are censored.");

export async function executeInteraction(interaction: CommandInteraction) {
    await interaction.reply({ embeds: [await getEmbed()] });
}

export async function executeMessage(message: Message) {
    await message.reply({ embeds: [await getEmbed()] });
}
