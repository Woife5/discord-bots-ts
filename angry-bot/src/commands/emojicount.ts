import { CommandInteraction, Message, EmbedBuilder, User as DiscordUser } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Stats, User } from "@helpers";
import { angryEmojis } from "@data";
import { CommandHandler } from "shared/lib/commands/types";

const embedColor = "#d94d26";

export const emojicount: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("emojicount")
        .setDescription("Get the total number of angry emojis sent.")
        .addUserOption(option => option.setName("user").setDescription("The user to get the emoji count for.")),
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        const user = interaction.options.getUser("user");
        interaction.reply({ embeds: [await runCommand(user)] });
    },
    executeMessage: async (message: Message): Promise<void> => {
        const user = message.mentions.users.first();
        message.reply({ embeds: [await runCommand(user)] });
    },
};

async function runCommand(user: DiscordUser | null | undefined) {
    let count = 0;

    const embed = new EmbedBuilder().setColor(embedColor).setTitle("Emoji Count");

    if (user) {
        const userResult = await User.findOne({ userId: user.id }).exec();

        if (!userResult) {
            return new EmbedBuilder().setColor(embedColor).setTitle("User not found!");
        }

        count = Object.values(userResult.emojis).reduce((acc, val) => acc + val, 0);

        // Get top 5 used emojis
        const topEmojis = Object.entries(userResult.emojis)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id, amount]) => `${angryEmojis[parseInt(id)]} - ${amount}x`)
            .join("\n");

        embed.setDescription(topEmojis);
        embed.setTitle(`Top 5 emojis sent for ${user.username}`);
    } else {
        const val = await Stats.findOne({ key: "total-angry-emojis-sent" }).exec();

        if (!val || val.key !== "total-angry-emojis-sent") {
            return new EmbedBuilder().setColor(embedColor).setTitle("Error 🤒");
        }

        count = val.value;

        embed.addFields({ name: "Total angry emojis sent", value: count.toString() });
    }

    return embed;
}
