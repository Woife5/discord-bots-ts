import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { ICommand } from "./command-interfaces";

async function runCommand(string_message: string, int_day: number, int_month: number, string_channel?: string) {

    let spamResult = "Done.";
    let currentDate = new Date();
    
    if (!string_channel) {
        //channel in which the user typed this command

        //if channel not found -> spamResult = "Channel not found. Abort."
    }

    if (!int_day || int_day > 31 || int_day < 1) {
        //current day

        if (int_day > 31 || int_day < 1){
            spamResult += " Day was out of range. Replaced with current date."
        }

        int_day = currentDate.getDay();
    }

    if (!int_month || int_month > 12 || int_month < 1) {

        if (int_month > 12 || int_month < 1) {
            spamResult += " Month was out of range. Replaced with current month."
        }

        int_month = currentDate.getMonth();
    }


    int_day = Math.ceil(int_day);
    int_month = Math.ceil(int_month);


    // date based -> create setTimeout + setInterval -> spam(message) (have a look at spam.ts)

    //if day and month are already in the past, calculate for next year -> untilDate


    //Todo needs to improve -> daily check without interval?
    /*setTimeOut(
        setTimeOut()
        spam(string_message, channel);
    ,untilDate-Date.now)*/


    return new MessageEmbed()
    .setTitle("SpamInterval")
    .setDescription(spamResult)
    .setColor("DARK_GOLD")
    .setAuthor({
        name: "Angry Bot",
        iconURL: "https://cdn.discordapp.com/attachments/314440449731592192/912125148474245221/angry.png",
    })
    
}