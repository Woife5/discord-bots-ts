import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { incrementStatAndUser } from "@helpers";
import { ICatboyPhraseResponse, ICatboyResponse } from "./command-interfaces";
import fetch from "node-fetch";
import { CommandHandler } from "shared/lib/commands/types";

const randomUrl = "https://api.catboys.com/img ";
const phraseUrl = "https://api.catboys.com/catboy";

export const catboy: CommandHandler = {
    data: new SlashCommandBuilder().setName("catboy").setDescription("Get a random catboy image."),
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        interaction.reply({ embeds: [await runCommand()] });
        incrementStatAndUser("catboys-requested", interaction.user);
    },
    executeMessage: async (message: Message): Promise<void> => {
        message.reply({ embeds: [await runCommand()] });
        incrementStatAndUser("catboys-requested", message.author);
    },
};

async function runCommand() {
    // load result from api and parse response
    const res = await fetch(randomUrl);
    const result = (await res.json()) as ICatboyResponse;

    const phrase = await fetch(phraseUrl);
    const catboyPhrase = (await phrase.json()) as ICatboyPhraseResponse;

    // send answer
    return new EmbedBuilder()
        .setTitle("Catboy")
        .setDescription(`Look at this catboy i found! ${catboyPhrase.response}`)
        .setColor("DarkGold")
        .setAuthor({
            name: "Angry Bot",
            iconURL: "https://cdn.discordapp.com/attachments/314440449731592192/912125148474245221/angry.png",
        })
        .setImage(result.url);
}
