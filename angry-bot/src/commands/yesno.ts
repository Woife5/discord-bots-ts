import { SlashCommandBuilder } from "@discordjs/builders";
import { incrementStatAndUser } from "@helpers";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import fetch from "node-fetch";
import { CommandHandler } from "shared/lib/commands/types.d";
import { IYesNo } from "./command-interfaces";

export const yesno: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("yesno")
        .setDescription("Get a yes or no answer to a question.")
        .addStringOption(option =>
            option.setName("question").setDescription("Your question to the angry-oracle").setRequired(true)
        ),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const question: string = (interaction.options.get("question")?.value as string) ?? "";
        interaction.reply({ embeds: [await runCommand(question)] });
        incrementStatAndUser("yesno-questions", interaction.user);
    },
};

async function runCommand(question: string) {
    const res = await fetch("https://yesno.wtf/api");
    const result = (await res.json()) as IYesNo;

    if (!question) {
        question = "Ehm how?";
    }

    return new EmbedBuilder()
        .setColor("Blue")
        .setTitle(question)
        .setDescription(`The answer is ${result.answer}. I have spoken.`)
        .setImage(result.image);
}
