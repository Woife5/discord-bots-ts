import { version } from "@data";
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Guild, Message, EmbedBuilder, User } from "discord.js";
import { getUserRole } from "helpers/user.util";
import * as Commands from "./";
import { ICommand, Role } from "./command-interfaces";

type CachedCommand = {
    name: string;
    description: string;
    role: Role;
};

let cache: CachedCommand[] | null = null;

function showCommand(command: CachedCommand, role: Role): boolean {
    return role >= command.role ?? Role.USER;
}

async function runCommand(user: User, guild: Guild | null) {
    if (!cache) {
        cache = Object.values(Commands).map(command => {
            return {
                name: command.data.name,
                description: command.data.description,
                role: command.role ?? Role.USER,
            };
        });
    }

    const embed = new EmbedBuilder()
        .setColor("#d94d26")
        .setTitle("Available Commands")
        .setFooter({
            text: `Angry Bot v${version}`,
        });

    if (!guild) {
        return embed.setDescription("This command can only be used in a server.");
    }

    const role = await getUserRole(user, guild);

    cache
        .filter(c => showCommand(c, role))
        .forEach(command => {
            embed.addFields({ name: command.name, value: command.description });
        });

    return embed;
}

export const help: ICommand = {
    data: new SlashCommandBuilder().setName("help").setDescription("Get a list of commands and a short explanation."),
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        await interaction.reply({ embeds: [await runCommand(interaction.user, interaction.guild)] });
    },
    executeMessage: async (message: Message): Promise<void> => {
        await message.reply({ embeds: [await runCommand(message.author, message.guild)] });
    },
};
