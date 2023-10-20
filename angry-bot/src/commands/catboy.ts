import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { CommandHandler } from "@woife5/shared/lib/commands/types.d";

export const catboy: CommandHandler = {
    data: new SlashCommandBuilder().setName("catboy").setDescription("Get a random catboy image."),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const embed = new EmbedBuilder()
            .setTitle("Catboy")
            .setDescription("Catboy API is no longer online sadly :(\nhttps://catboys.com")
            .setColor("Red");

        interaction.reply({ embeds: [embed] });
        // incrementStatAndUser("catboys-requested", interaction.user);
    },
};
