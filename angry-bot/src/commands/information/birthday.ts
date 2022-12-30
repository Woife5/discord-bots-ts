import { angryBirthday } from "@data";
import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { CommandHandler } from "shared/lib/commands/types.d";
import { daysUntil } from "shared/lib/utils/date.util";

export const birthday: CommandHandler = {
    data: new SlashCommandBuilder().setName("birthday").setDescription("Get the date of my birthday."),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        interaction.reply({ embeds: [getEmbed()] });
    },
};

function getEmbed() {
    const nextBirthday = new Date(angryBirthday);
    nextBirthday.setFullYear(new Date().getFullYear());
    if (nextBirthday < new Date()) {
        nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
    }

    return new EmbedBuilder()
        .setColor("#d94d26")
        .setTitle("MY BIRTHDAY")
        .setDescription(
            `My birthday is on ${angryBirthday.toLocaleDateString("de-AT")}, in ${Math.round(
                daysUntil(nextBirthday)
            )} days.`
        )
        .setAuthor({
            name: "Angry",
            iconURL: "https://cdn.discordapp.com/attachments/314440449731592192/912125148474245221/angry.png",
            url: "https://github.com/Woife5/angrier-bot",
        });
}
