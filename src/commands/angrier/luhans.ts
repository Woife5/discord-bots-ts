import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { ICommand } from '../command-interfaces';
import { NumberUtils } from '../../helpers';
import { medienDispositive, geschmacksliste, funStuff, names } from '../../data';

const medienKlausur = new Date('2021-07-02T11:00:00');

function runCommand() {
    const embed = new MessageEmbed().setColor('DARK_VIVID_PINK');

    switch (NumberUtils.getRandomInt(0, 2)) {
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
            const secondText = sSinceKlausur > 1 ? 'Sekunden' : 'Sekunde';
            const minuteText = mSinceKlausur > 1 ? 'Minuten' : 'Minute';
            const hourText = hSinceKlausur > 1 ? 'Stunden' : 'Stunde';

            embed
                .addField(
                    'McKlausur',
                    `Sei glücklich, es sind bereits ${dSinceKlausur} Tage ${hSinceKlausur} ${hourText} ${mSinceKlausur} ${minuteText} und ${sSinceKlausur} ${secondText} sind seit der Medientheorie Klausur mit ${
                        names[NumberUtils.getRandomInt(0, names.length)]
                    } vergangen!\nEine rachsüchtige Erinnerung - ich hoffe, sie macht dich wütend.`
                )
                .setTimestamp(medienKlausur);

            break;
        }

        // Case to get some proper medienDispositive!
        case 1: {
            const name = names[NumberUtils.getRandomInt(0, names.length - 1)];
            embed.addField(
                `Hallo, ich bin ${name} und das ist meine momentane, unverständliche Weisheit:`,
                medienDispositive[NumberUtils.getRandomInt(0, medienDispositive.length - 1)]
            );
            embed.setAuthor({ name: name });
            break;
        }

        // Good to know when this exam ended
        case 2: {
            let text = funStuff[NumberUtils.getRandomInt(0, funStuff.length - 1)];
            text = text.replaceAll('<name>', names[NumberUtils.getRandomInt(0, names.length - 1)]);
            text = text.replaceAll(
                '<geschmack>',
                geschmacksliste[NumberUtils.getRandomInt(0, geschmacksliste.length - 1)]
            );
            text = text.replaceAll(
                '<dispositiv>',
                medienDispositive[NumberUtils.getRandomInt(0, medienDispositive.length - 1)]
            );
            embed.setDescription(text);
            break;
        }
    }

    return embed;
}

export const luhans: ICommand = {
    data: new SlashCommandBuilder().setName('luhans').setDescription('Get McLuhans current wisdom.'),
    executeInteraction(interaction: CommandInteraction) {
        interaction.reply({ embeds: [runCommand()] });
    },
    executeMessage(message: Message, args: string[]) {
        message.channel.send({ embeds: [runCommand()] });
    },
};
