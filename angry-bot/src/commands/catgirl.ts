import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { incrementStatAndUser } from "@helpers";
import { ICatgirlResponse, ICommand } from "./command-interfaces";
import fetch from "node-fetch";
import { getRandomInt } from "shared/lib/utils/number.util";

const randomUrl = "https://nekos.moe/api/v1/random/image";
const imageUrl = "https://nekos.moe/image/";

async function runCommand() {
    // load result from api and parse response
    const res = await fetch(randomUrl);
    const result = (await res.json()) as ICatgirlResponse;

    const randomWord = result.images[0].tags[getRandomInt(0, result.images[0].tags.length - 1)];
    const image = imageUrl + result.images[0].id;

    // send answer
    return new EmbedBuilder()
        .setTitle("Catgirl")
        .setDescription(`Look at this ${randomWord} catgirl i found uwu`)
        .setColor("DarkGold")
        .setAuthor({
            name: "Angry Bot",
            iconURL: "https://cdn.discordapp.com/attachments/314440449731592192/912125148474245221/angry.png",
        })
        .setImage(image);
}

export const catgirl: ICommand = {
    data: new SlashCommandBuilder().setName("catgirl").setDescription("Get a random catgirl image."),
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        interaction.reply({ embeds: [await runCommand()] });
        incrementStatAndUser("catgirls-requested", interaction.user);
    },
    executeMessage: async (message: Message): Promise<void> => {
        message.reply({ embeds: [await runCommand()] });
        incrementStatAndUser("catgirls-requested", message.author);
    },
};
