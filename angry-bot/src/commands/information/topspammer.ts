import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { getTopSpammers } from "helpers/user.util";
import { CommandHandler } from "shared/lib/commands/types.d";

export const topspammer: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("topspammer")
        .setDescription("Get a list of the global top 5 angry spammers."),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        interaction.reply({ embeds: [await runCommand()] });
    },
};

async function runCommand() {
    const usersWithEmojis = await getTopSpammers();

    const embed = new EmbedBuilder().setTitle("Top Angry Spammers").setColor("#d94d26");

    for (let i = 0; i < 5 && i < usersWithEmojis.length; i++) {
        const user = usersWithEmojis[i];
        embed.addFields({
            name: `${i + 1}. ${user.userName}`,
            value: `${user.spamCount.toLocaleString("de-AT")} angrys`,
        });
    }

    return embed;
}
