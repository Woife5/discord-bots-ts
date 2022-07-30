import { version } from "@data";
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import * as Commands from "./";
import { ICommand } from "./command-interfaces";

let cache:
    | {
          name: string;
          description: string;
      }[]
    | null = null;

function runCommand() {
    if (!cache) {
        cache = Object.values(Commands).map(command => {
            return {
                name: command.data.name,
                description: command.data.description,
            };
        });
    }

    const embed = new MessageEmbed()
        .setColor("#d94d26")
        .setTitle("Available Commands")
        .setFooter({
            text: `Angry Bot v${version}`,
        });

    cache.forEach(command => {
        embed.addField(command.name, command.description);
    });

    return embed;
}

export const help: ICommand = {
    data: new SlashCommandBuilder().setName("help").setDescription("Get a list of commands and a short explanation."),
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        await interaction.reply({ embeds: [runCommand()] });
    },
    executeMessage: async (message: Message): Promise<void> => {
        await message.reply({ embeds: [runCommand()] });
    },
};
