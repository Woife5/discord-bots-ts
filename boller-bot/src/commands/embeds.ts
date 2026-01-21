import { EmbedBuilder } from "discord.js";

export const bollerwagenLogoUrl =
    "https://myonlineradio.at/public/uploads/radio_img/radio-bollerwagen/play_250_250.webp";

export const defaultEmbed = () =>
    new EmbedBuilder()
        .setColor("DarkVividPink")
        .setAuthor({ name: "BollerBot", iconURL: bollerwagenLogoUrl, url: "https://radiobollerwagen.de/" });
