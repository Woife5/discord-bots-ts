import { incrementStatAndUser } from "@helpers";
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { CommandHandler } from "@woife5/shared/lib/commands/types.d";

type ApiResponse = {
    answer: "yes" | "no" | "maybe";
    forced: boolean;
    image: string;
};

export const yesno: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("yesno")
        .setDescription("Get a yes or no answer to a question.")
        .addStringOption(option =>
            option.setName("question").setDescription("Your question to the angry-oracle").setRequired(true)
        ),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const question = interaction.options.getString("question", true);
        interaction.reply({ embeds: [await runCommand(question)] });
        incrementStatAndUser("yesno-questions", interaction.user);
    },
};

async function runCommand(question: string) {
    const res = await fetch("https://yesno.wtf/api");
    const result = (await res.json()) as ApiResponse;

    return new EmbedBuilder()
        .setColor("Blue")
        .setTitle(question)
        .setDescription(`The answer is ${result.answer}. I have spoken.`)
        .setImage(result.image);
}
