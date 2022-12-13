import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { medienDispositive, geschmacksliste, funStuff, names } from "@data";
import { incrementStatAndUser } from "@helpers";
import { getRandomInt } from "shared/lib/utils/number.util";
import { CommandHandler } from "shared/lib/commands/types.d";

const medienKlausur = new Date("2021-07-02T11:00:00");

export const luhans: CommandHandler = {
    data: new SlashCommandBuilder().setName("luhans").setDescription("Get a part of McLuhans wisdom."),
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        interaction.reply({ embeds: [runCommand()] });
        incrementStatAndUser("mc-luhans", interaction.user);
    },
    executeMessage: async (message: Message): Promise<void> => {
        message.reply({ embeds: [runCommand()] });
        incrementStatAndUser("mc-luhans", message.author);
    },
};
function runCommand() {
    const embed = new EmbedBuilder().setColor("DarkVividPink");

    switch (getRandomInt(0, 2)) {
        // Case to get fun stuff
        case 0: {
            // Calculate the time since the medien-t test.
            let msSinceKlausur = Date.now() - medienKlausur.getTime();
            const dSinceKlausur = Math.floor(msSinceKlausur / 1000 / 60 / 60 / 24);
            msSinceKlausur -= dSinceKlausur * 1000 * 60 * 60 * 24;

            const hSinceKlausur = Math.floor(msSinceKlausur / 1000 / 60 / 60);
            msSinceKlausur -= hSinceKlausur * 1000 * 60 * 60;

            const mSinceKlausur = Math.floor(msSinceKlausur / 1000 / 60);
            msSinceKlausur -= mSinceKlausur * 1000 * 60;

            const sSinceKlausur = Math.floor(msSinceKlausur / 1000);

            // No need to calculate dayText since it has been days when this code was created!
            const secondText = sSinceKlausur > 1 ? "Sekunden" : "Sekunde";
            const minuteText = mSinceKlausur > 1 ? "Minuten" : "Minute";
            const hourText = hSinceKlausur > 1 ? "Stunden" : "Stunde";

            embed
                .addFields({
                    name: "McKlausur",
                    value: `Sei glücklich, es sind bereits ${dSinceKlausur} Tage ${hSinceKlausur} ${hourText} ${mSinceKlausur} ${minuteText} und ${sSinceKlausur} ${secondText} sind seit der Medientheorie Klausur mit ${
                        names[getRandomInt(0, names.length - 1)]
                    } vergangen!\nEine rachsüchtige Erinnerung - ich hoffe, sie macht dich wütend.`,
                })
                .setTimestamp(medienKlausur);

            break;
        }

        // Case to get some proper medienDispositive!
        case 1: {
            const name = names[getRandomInt(0, names.length - 1)];
            embed.addFields({
                name: `Hallo, ich bin ${name} und das ist meine momentane, unverständliche Weisheit:`,
                value: medienDispositive[getRandomInt(0, medienDispositive.length - 1)],
            });
            embed.setAuthor({ name: name });
            break;
        }

        // Good to know when this exam ended
        case 2: {
            let text = funStuff[getRandomInt(0, funStuff.length - 1)];
            text = text.replaceAll("<name>", names[getRandomInt(0, names.length - 1)]);
            text = text.replaceAll("<geschmack>", geschmacksliste[getRandomInt(0, geschmacksliste.length - 1)]);
            text = text.replaceAll("<dispositiv>", medienDispositive[getRandomInt(0, medienDispositive.length - 1)]);
            embed.setDescription(text);
            break;
        }
    }

    return embed;
}
