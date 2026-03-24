import { EmbedBuilder } from "discord.js";
import { COPILOT_ICON } from "../consants";

export const adminEmbed = () =>
    new EmbedBuilder()
        .setColor("Aqua")
        .setAuthor({ name: "Copilot", iconURL: COPILOT_ICON })
        .setTitle("Microsoft Copilot");
