import { angryIconCDN, repoURL, version } from "@data";
import { EmbedBuilder } from "discord.js";

const footer = { text: `Angry Bot v${version}` };
const author = { name: "Angry Bot", iconURL: angryIconCDN, url: repoURL };

export function adminEmbed() {
    return new EmbedBuilder().setColor("White").setFooter(footer);
}

export const infoEmbedColor = "#d94d26";
export function infoEmbed() {
    return new EmbedBuilder().setColor(infoEmbedColor).setAuthor(author);
}

export function angryCoinEmbed() {
    return new EmbedBuilder().setColor("Yellow").setAuthor(author);
}
