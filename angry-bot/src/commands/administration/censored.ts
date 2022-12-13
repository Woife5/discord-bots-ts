import { CommandInteraction, Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { CensorshipUtil } from "@helpers";
import { CommandHandler, Role } from "shared/lib/commands/types.d";

export const censored: CommandHandler = {
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

export async function getEmbed() {
    const c = await CensorshipUtil.getAll();

    if (c.size <= 0) {
        return new EmbedBuilder().setColor("#d94d26").setTitle("No consored strings found!");
    }

    const all = [...c];
    return new EmbedBuilder().setTitle("Censored Strings:").setDescription("`" + all.join("`, `") + "`");
}
