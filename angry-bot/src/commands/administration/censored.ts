import { CommandInteraction, Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { CensorshipUtil } from "@helpers";
import { ICommand, Role } from "../command-interfaces";

export async function getEmbed() {
    const censored = await CensorshipUtil.getAll();

    if (censored.size <= 0) {
        return new EmbedBuilder().setColor("#d94d26").setTitle("No consored strings found!");
    }

    const allCensored = [...censored];
    return new EmbedBuilder().setTitle("Censored Strings:").setDescription("`" + allCensored.join("`, `") + "`");
}

export const censored: ICommand = {
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
