import { COPILOT_ICON } from "consants";
import { EmbedBuilder } from "discord.js";

export const adminEmbed = () =>
    new EmbedBuilder()
        .setColor("Aqua")
        .setAuthor({ name: "Copilot", iconURL: COPILOT_ICON })
        .setTitle("Microsoft Copilot");
