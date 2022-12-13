import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { angryIconCDN, prefix, repoURL, version } from "@data";
import { CommandHandler } from "shared/lib/commands/types";

export const about: CommandHandler = {
    data: new SlashCommandBuilder().setName("about").setDescription("Get a list of commands and a short explanation."),
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        interaction.reply({ embeds: [runCommand()] });
    },
    executeMessage: async (message: Message): Promise<void> => {
        message.reply({ embeds: [runCommand()] });
    },
};

function runCommand() {
    return new EmbedBuilder()
        .setColor("#d94d26")
        .setTitle("About")
        .addFields([
            { name: "Regular Commands", value: `This bot uses regular commands with the prifix \`${prefix}\`` },
            {
                name: "Slash Command",
                value: "Some commands are also available as slash commands. Just browse them by typing a `/`.",
            },
        ])
        .setAuthor({
            name: "Angry",
            iconURL: angryIconCDN,
            url: repoURL,
        })
        .setFooter({
            text: `Angry Bot v${version}`,
        });
}
