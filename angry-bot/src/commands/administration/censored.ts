import { SlashCommandBuilder } from "@discordjs/builders";
import { CensorshipUtil } from "@helpers";
import { CommandInteraction, EmbedBuilder, Message } from "discord.js";
import { CommandHandler } from "shared/lib/commands/types.d";

export const censored: CommandHandler = {
    data: new SlashCommandBuilder().setName("censored").setDescription("Get a list of censored strings."),
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        interaction.reply({ embeds: [await getCensoredEmbed()] });
    },
    executeMessage: async (message: Message): Promise<void> => {
        message.reply({ embeds: [await getCensoredEmbed()] });
    },
};

export async function getCensoredEmbed() {
    const c = await CensorshipUtil.getAll();

    if (c.size <= 0) {
        return new EmbedBuilder().setColor("#d94d26").setTitle("No consored strings found!");
    }

    const all = [...c];
    return new EmbedBuilder().setTitle("Censored Strings:").setDescription("`" + all.join("`, `") + "`");
}
