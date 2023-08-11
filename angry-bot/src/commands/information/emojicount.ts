import { angryEmojis } from "@data";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Stats } from "@helpers";
import { ChatInputCommandInteraction, User as DiscordUser } from "discord.js";
import { getUser } from "helpers/user.util";
import { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { infoEmbed } from "../embeds";

export const emojicount: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("emojicount")
        .setDescription("Get the total number of angry emojis sent.")
        .addUserOption(option => option.setName("user").setDescription("The user to get the emoji count for.")),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const user = interaction.options.getUser("user");
        interaction.reply({ embeds: [await runCommand(user)] });
    },
};

async function runCommand(user: DiscordUser | null | undefined) {
    if (user) {
        const userResult = await getUser(user.id);

        if (!userResult) {
            return infoEmbed().setTitle("User not found!");
        }

        // Get top 5 used emojis
        const topEmojis = Object.entries(userResult.emojis)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id, amount]) => `${angryEmojis[parseInt(id) - 1]} - ${amount.toLocaleString("de-AT")}x`)
            .join("\n");

        return infoEmbed().setDescription(topEmojis).setTitle(`Top 5 emojis sent for ${user.username}`);
    }

    const val = await Stats.findOne({ key: "total-angry-emojis-sent" }).exec();

    if (!val || val.key !== "total-angry-emojis-sent") {
        return infoEmbed().setTitle("Error 🤒");
    }

    return infoEmbed().addFields({ name: "Total angry emojis sent", value: val.value.toLocaleString("de-AT") });
}
