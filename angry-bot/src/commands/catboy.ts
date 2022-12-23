import { SlashCommandBuilder } from "@discordjs/builders";
import { incrementStatAndUser } from "@helpers";
import { CommandInteraction, EmbedBuilder, Message } from "discord.js";
import fetch from "node-fetch";
import { CommandHandler } from "shared/lib/commands/types.d";
import { ICatboyPhraseResponse, ICatboyResponse } from "./command-interfaces";

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
        .setImage(result.url);
}
