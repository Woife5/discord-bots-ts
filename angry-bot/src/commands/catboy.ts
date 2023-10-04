import { incrementStatAndUser } from "@helpers";
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import fetch from "node-fetch";
import { CommandHandler } from "@woife5/shared/lib/commands/types.d";

const randomUrl = "https://api.catboys.com/img ";
const phraseUrl = "https://api.catboys.com/catboy";

type CatboyPhraseResponse = {
    response: string;
    error: string;
};

type CatboyResponse = {
    url: string;
    artist: string;
    artist_url: string;
    source_url: string;
    error: string;
};

export const catboy: CommandHandler = {
    data: new SlashCommandBuilder().setName("catboy").setDescription("Get a random catboy image."),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        await interaction.deferReply();
        interaction.editReply({ embeds: [await runCommand()] });
        incrementStatAndUser("catboys-requested", interaction.user);
    },
};

async function runCommand() {
    // load result from api and parse response
    const res = await fetch(randomUrl);
    const result = (await res.json()) as CatboyResponse;

    const phrase = await fetch(phraseUrl);
    const catboyPhrase = (await phrase.json()) as CatboyPhraseResponse;

    // send answer
    return new EmbedBuilder()
        .setTitle("Catboy")
        .setDescription(`Look at this catboy i found! ${catboyPhrase.response}`)
        .setColor("DarkGold")
        .setImage(result.url);
}
