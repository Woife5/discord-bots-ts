import { ChatInputCommandInteraction, EmbedBuilder, Message } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandHandler } from "shared/lib/commands/types.d";
import { angryIconCDN, repoURL, version } from "@data";
import { getTopSpammers } from "helpers/user.util";

export const topspammer: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("topspammer")
        .setDescription("Get a list of the global top 5 angry spammers."),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        interaction.reply({ embeds: [await runCommand()] });
    },
    executeMessage: async (message: Message): Promise<void> => {
        message.reply({ embeds: [await runCommand()] });
    },
};

async function runCommand() {
    const usersWithEmojis = await getTopSpammers();

    const embed = new EmbedBuilder()
        .setTitle("Top Angry Spammers")
        .setColor("#d94d26")
        .setAuthor({
            name: "Angry",
            iconURL: angryIconCDN,
            url: repoURL,
        })
        .setFooter({
            text: `Angry Bot v${version}`,
        });

    for (let i = 0; i < 5 && i < usersWithEmojis.length; i++) {
        const user = usersWithEmojis[i];
        embed.addFields({
            name: `${i + 1}. ${user.userName}`,
            value: `${user.spamCount.toLocaleString("de-AT")} angrys`,
        });
    }

    return embed;
}
