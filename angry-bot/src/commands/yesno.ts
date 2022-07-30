import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { ICommand, IYesNo } from "./command-interfaces";
import { incrementStatAndUser } from "@helpers";
import fetch from "node-fetch";

async function runCommand(question: string) {
    const res = await fetch("https://yesno.wtf/api");
    const result = (await res.json()) as IYesNo;

    if (!question) {
        question = "Ehm how?";
    }

    return new MessageEmbed()
        .setColor("BLUE")
        .setTitle(question)
        .setDescription(`The answer is ${result.answer}. I have spoken.`)
        .setImage(result.image);
}

export const yesno: ICommand = {
    data: new SlashCommandBuilder()
        .setName("yesno")
        .setDescription("Get a yes or no answer to a question.")
        .addStringOption(option =>
            option.setName("question").setDescription("Your question to the angry-oracle").setRequired(true)
        ),
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        const question: string = (interaction.options.get("question")?.value as string) ?? "";
        interaction.reply({ embeds: [await runCommand(question)] });
        incrementStatAndUser("yesno-questions", interaction.user);
    },
    executeMessage: async (message: Message, args: string[]): Promise<void> => {
        message.reply({ embeds: [await runCommand(args.join(" "))] });
        incrementStatAndUser("yesno-questions", message.author);
    },
};
