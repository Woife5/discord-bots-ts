import { Log } from "@helpers";

const log = new Log("Spam");


//loads the spamming data from the database on startup 
export async function init() {
    //loads all spam from database

    //identifies wether if it's date based or interval based
    //calls spamdate runCommand() or spaminterval runCommand() respectively
    //this would reduce code and focus timing logic on these commands

    //those commands will call spam(string) to spam something
}

//is used as spamming function
export async function spam(string_message: string, string_channel: string){
    //message
    //etc

    //this function is intended to be called in intervals (can also be called by spamdate and spaminterval!)

    //returns MessageEmbed
}

export async function storeSpamInDataBase() {//Todo check if this not already exists somewhere
    //this should also be called by spamInterval and spamDate
}