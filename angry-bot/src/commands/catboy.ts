import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { incrementStatAndUser } from "@helpers";
import { getUserActionCache, updateUserActionCache } from "helpers/user.util";
import { cdnURL } from "@data";
import { getRandomInt } from "@woife5/shared/lib/utils/number.util";

const SPECIAL_THRESHHOLD = 10;
const SPECIAL_CHANCE = 0.1;

type CatboyInfo = {
    // naming: string;
    // extension: string;
    maxIndex: number;
};

function isCatboyInfo(data: unknown): data is CatboyInfo {
    return (
        typeof data === "object" &&
        data !== null &&
        // typeof (data as CatboyInfo).naming === "string" &&
        // typeof (data as CatboyInfo).extension === "string" &&
        typeof (data as CatboyInfo).maxIndex === "number"
    );
}

// Fallback values from first version
let MAX_NORMAL = 255,
    MAX_OBESE = 28;

Promise.all([fetch(`${cdnURL}/catboys/normal/info.json`), fetch(`${cdnURL}/catboys/obese/info.json`)])
    .then(([normal, obese]) => Promise.all([normal.json(), obese.json()]))
    .then(([normal, obese]) => {
        if (isCatboyInfo(normal)) {
            MAX_NORMAL = normal.maxIndex || 255;
        }

        if (isCatboyInfo(obese)) {
            MAX_OBESE = obese.maxIndex || 28;
        }
    });

const matziDiscordId = "300673115791294474";

export const catboy: CommandHandler = {
    data: new SlashCommandBuilder().setName("catboy").setDescription("Get a random catboy image."),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const userCache = getUserActionCache(interaction.user.id);
        const catboysRequested = userCache?.catboys ?? 0;

        let image = `${cdnURL}/catboys/normal/catboy_${getRandomInt(1, MAX_NORMAL)}.png`;
        let description = "Look at this fabulous catboy I found! owo";

        if (catboysRequested > SPECIAL_THRESHHOLD) {
            if (Math.random() < SPECIAL_CHANCE) {
                image = `${cdnURL}/catboys/obese/catboy_${getRandomInt(1, MAX_OBESE)}.png`;
                description = "Look at this fabulous special boi i found 😻 uwu";
                setTimeout(() => {
                    interaction.channel?.send(`<@${matziDiscordId}> this one is for you :3`);
                }, 50);
            }
        }

        const embed = new EmbedBuilder()
            .setTitle("Catboy")
            .setDescription(description)
            .setColor("DarkGold")
            .setImage(image);

        interaction.reply({ embeds: [embed] });

        incrementStatAndUser("catboys-requested", interaction.user);
        updateUserActionCache(interaction.user.id, { catboys: 1 });
    },
};
