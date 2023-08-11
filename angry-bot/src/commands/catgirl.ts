import { SlashCommandBuilder } from "@discordjs/builders";
import { incrementStatAndUser } from "@helpers";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import fetch from "node-fetch";
import { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { getRandomInt } from "@woife5/shared/lib/utils/number.util";

const randomUrl = "https://nekos.moe/api/v1/random/image";
const imageUrl = "https://nekos.moe/image/";

type CatgirlImage = {
    id: string;
    originalHash: string;
    tags: string[];
    nsfw: boolean;
    createdAt: string;
};

type CatgirlResponse = {
    images: CatgirlImage[];
};

export const catgirl: CommandHandler = {
    data: new SlashCommandBuilder().setName("catgirl").setDescription("Get a random catgirl image."),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        interaction.reply({ embeds: [await runCommand()] });
        incrementStatAndUser("catgirls-requested", interaction.user);
    },
};
async function runCommand() {
    // load result from api and parse response
    const res = await fetch(randomUrl);
    const result = (await res.json()) as CatgirlResponse;

    const randomWord = result.images[0].tags[getRandomInt(0, result.images[0].tags.length - 1)];
    const image = imageUrl + result.images[0].id;

    // send answer
    return new EmbedBuilder()
        .setTitle("Catgirl")
        .setDescription(`Look at this ${randomWord} catgirl i found uwu`)
        .setColor("DarkGold")
        .setImage(image);
}
