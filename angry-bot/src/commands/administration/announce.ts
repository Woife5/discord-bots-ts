import { Message, EmbedBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ChannelType, Guild } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { GuildSettingsCache } from "@helpers";
import { CommandHandler, Role } from "shared/lib/commands/types.d";
import { version } from "@data";

export const announce: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("announce")
        .setDescription("Announce someting in a guild's broadcast channel.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName("message").setDescription("The message to announce.").setRequired(true)
        ),
    role: Role.ADMIN,
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const message = interaction.options.getString("message") ?? "";

        interaction.reply({ embeds: [await runCommand(message, interaction.guild)] });
    },
    executeMessage: async (message: Message): Promise<void> => {
        message.reply({ embeds: [embed().setDescription("Please use the respective slash-command!")] });
    },
};

const embed = () => {
    return new EmbedBuilder()
        .setColor("White")
        .setTitle("Announcement")
        .setFooter({
            text: `Angry Bot v${version}`,
        });
};

async function runCommand(message: string, guild: Guild | null) {
    if (!guild) {
        return embed().setDescription("This command can only be used in a server.");
    }

    const channelId = (await GuildSettingsCache.get(guild.id))?.broadcastChannelId;

    if (!channelId) {
        return embed().setDescription("For this guild no broadcast channel has been set yet.");
    }

    const channel = await guild.channels.fetch(channelId);
    if (channel?.type !== ChannelType.GuildText) {
        return embed().setDescription("The set broadcast channel is not a text channel, this should not happen x.x");
    }

    await channel.send(message);

    return embed().setDescription("The message has been successfuly broadcast.");
}
