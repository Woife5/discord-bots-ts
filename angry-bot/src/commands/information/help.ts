import { version } from "@data";
import { SlashCommandBuilder } from "@discordjs/builders";
import { APIEmbedField, ChatInputCommandInteraction, EmbedBuilder, Guild, User } from "discord.js";
import { CommandHandler } from "shared/lib/commands/types.d";
import * as Commands from "..";

export const help: CommandHandler = {
    data: new SlashCommandBuilder().setName("help").setDescription("Get a list of commands and a short explanation."),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        await interaction.reply({ embeds: [await runCommand(interaction.user, interaction.guild)] });
    },
};

const defaultEmbed = () =>
    new EmbedBuilder()
        .setColor("#d94d26")
        .setTitle("Available Commands")
        .setFooter({
            text: `Angry Bot v${version}`,
        });

async function runCommand(user: User, guild: Guild | null) {
    if (!guild) {
        return defaultEmbed().setDescription("This command can only be used in a server.");
    }

    const isAdmin = guild?.members.cache.get(user.id)?.permissions.has("Administrator") ?? false;

    const showCommand = (command: CommandHandler) => isAdmin || command.data.default_member_permissions === "8";
    return defaultEmbed().addFields(
        Object.values(Commands)
            .filter(showCommand)
            .map(command => {
                return {
                    name: command.data.name,
                    value: command.data.description,
                } satisfies APIEmbedField;
            })
    );
}
