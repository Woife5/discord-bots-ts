import { angryBirthday } from "@data";
import { SlashCommandBuilder } from "@discordjs/builders";
import { infoEmbed } from "commands/embeds";
import { ChatInputCommandInteraction } from "discord.js";
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

    return infoEmbed()
        .setTitle("MY BIRTHDAY")
        .setDescription(
            `My birthday is on ${angryBirthday.toLocaleDateString("de-AT")}, in ${Math.round(
                daysUntil(nextBirthday)
            )} days.`
        );
}
