import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { angryIconCDN, prefix, repoURL, version } from "@data";
import { ICommand } from "./command-interfaces";

function runCommand() {
    return new MessageEmbed()
        .setColor("#d94d26")
        .setTitle("About")
        .addField("Regular Commands", `This bot uses regular commands with the prifix \`${prefix}\``)
        .addField(
            "Slash Command",
            "Some commands are also available as slash commands. Just browse them by typing a `/`."
        )
        .setAuthor({
            name: "Angry",
            iconURL: angryIconCDN,
            url: repoURL,
        })
        .setFooter({
            text: `Angry Bot v${version}`,
        });
}

export const about: ICommand = {
    data: new SlashCommandBuilder().setName("about").setDescription("Get a list of commands and a short explanation."),
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        interaction.reply({ embeds: [runCommand()] });
    },
    executeMessage: async (message: Message): Promise<void> => {
        message.reply({ embeds: [runCommand()] });
    },
};
