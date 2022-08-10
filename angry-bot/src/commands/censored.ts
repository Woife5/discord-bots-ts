import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { ConfigCache } from "@helpers";
import { ICommand, Role } from "./command-interfaces";

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

export const censored: ICommand = {
    data: new SlashCommandBuilder().setName("censored").setDescription("Get a list of censored strings."),
    role: Role.ADMIN,
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        interaction.reply({ embeds: [await getEmbed()] });
    },
    executeMessage: async (message: Message): Promise<void> => {
        message.reply({ embeds: [await getEmbed()] });
    },
};
