import { EmbedBuilder } from "discord.js";

export const bollerwagenLogoUrl =
    "https://radiobollerwagen.de/wp-content/uploads/2023/05/ffn_Logo_Radio_Bollerwagen_rgb-kleiner.png";

export const defaultEmbed = () =>
    new EmbedBuilder()
        .setColor("DarkVividPink")
        .setAuthor({ name: "BollerBot", iconURL: bollerwagenLogoUrl, url: "https://radiobollerwagen.de/" });
