import { SlashCommandBuilder } from "discord.js";
import { CommandHandler } from "shared/lib/commands/types";
// import willhaben from "willhaben";

export const search: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("search")
        .setDescription("Search for a specific item on willhaben.")
        .addStringOption(option =>
            option.setName("searchterm").setDescription("The search term to search for.").setRequired(true)
        ),
    executeInteraction: async interaction => {
        const searchTerm = interaction.options.getString("searchterm", true);
        await interaction.reply(searchTerm);
    },
};
