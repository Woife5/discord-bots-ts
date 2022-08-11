import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { ICommand, Role } from "./command-interfaces";

async function runCommand(string_message: string, int_interval: number, int_hourBegin?: number, string_channel?: string) {

    let spamResult = "Done.";
    
    if (!string_channel) {
        //Todo channel in which the user typed this command

        //if channel not found -> spamResult = "Channel not found. Abort."
    }

    //wenn keine Stunde Begin -> now
    if (!int_hourBegin || int_hourBegin > 24 || int_hourBegin < 0) {
        int_hourBegin = new Date().getHours();

        if (int_hourBegin > 24 || int_hourBegin < 0) {
            spamResult += " Hour was out of range. Replaced with current hour."
        }
    }

    // interval in stunden -> check mindestens eine Stunde
    if (int_interval < 1) {
        int_interval = 1;
    }

    //Rounding all numbers
    int_hourBegin = Math.ceil(int_hourBegin);
    int_interval = Math.ceil(int_interval);


    //calculate untilHour Date -> next Date with the hour

    /*setTimeOut(
        setInterval(() => {
            Spam.spam(string_message, channel)
        }, int_interval * 60 * 60 * 1000);
        Spam.spam(string_message, channel);
    ,untilHour-Date.now)*/

    return new MessageEmbed()
    .setTitle("SpamInterval")
    .setDescription(spamResult)
    .setColor("DARK_GOLD")
    .setAuthor({
        name: "Angry Bot",
        iconURL: "https://cdn.discordapp.com/attachments/314440449731592192/912125148474245221/angry.png",
    })
    
}

export const spaminterval: ICommand = {
    role: Role.ADMIN,
    data: new SlashCommandBuilder()
        .setName("spaminterval")
        .setDescription("Spam a message for a certain interval")
        .addStringOption(option =>
            option
                .setName("message")
                .setDescription("The message that should be spammed")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("interval")
                .setDescription("The interval in hours in which the spam should be spammed")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("hour")
                .setDescription("A specific hour in which the interval should begin. (Optional)")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("channel")
                .setDescription("The channel in which the message should be sent. (Optional)")
                .setRequired(false)
        ),
    executeInteraction: async (interaction: CommandInteraction) => {
        const string_message = interaction.options.get("message")?.value as string;
        const int_interval = interaction.options.get("interval")?.value as number;
        const int_hourBegin = interaction.options.get("hour")?.value as number | undefined;
        const int_channel = interaction.options.get("channel")?.value as string | undefined;

        await interaction.reply({ embeds: [await runCommand(string_message, int_interval, int_hourBegin, int_channel)] });
    },
    executeMessage: async (message: Message, args: string[]) => {
        const str_message = args[0]?.toLowerCase() as string;
        const str_interval = args[1]?.toLowerCase() as string;
        const str_hourBegin = args[2]?.toLowerCase() as string | undefined;
        const str_channel =  args[3]?.toLowerCase() as string | undefined;
        let int_interval: number;
        let int_hourBegin: number | undefined;

        if (str_interval) int_interval = parseInt(str_interval);
        if (str_hourBegin) int_hourBegin = parseInt(str_hourBegin);

        await message.reply({ embeds: [await runCommand(str_message, int_interval, int_hourBegin, str_channel)] });
    },
};
