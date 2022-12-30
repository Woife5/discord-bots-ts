import { angryIconCDN, prefix, repoURL, version } from "@data";
import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { CommandHandler } from "shared/lib/commands/types.d";

export const about: CommandHandler = {
    data: new SlashCommandBuilder().setName("about").setDescription("Get a list of commands and a short explanation."),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const embed = new EmbedBuilder()
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
        interaction.reply({ embeds: [embed] });
    },
};
