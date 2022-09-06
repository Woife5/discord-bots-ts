import { CommandInteraction, Message, MessageEmbed, User as DiscordUser } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Stats, User } from "@helpers";
import { ICommand } from "./command-interfaces";

const embedColor = "#d94d26";

async function runCommand(user?: DiscordUser) {
    let emojicount = 0;

    if (user) {
        const userResult = await User.findOne({ userId: user.id }).exec();

        if (!userResult) {
            return new MessageEmbed().setColor(embedColor).setTitle("User not found!");
        }

        emojicount = Object.values(userResult.emojis).reduce((acc, val) => acc + val, 0);
    } else {
        const val = await Stats.findOne({ key: "total-angry-emojis-sent" }).exec();

        if (!val || val.key !== "total-angry-emojis-sent") {
            return new MessageEmbed().setColor(embedColor).setTitle("Error 🤒");
        }

        emojicount = val.value;
    }

    return new MessageEmbed()
        .setColor(embedColor)
        .setTitle("Emoji Stats")
        .addField(`${user ? "Your t" : "T"}otal emoji cout`, `${emojicount}`);
}

export const emojicount: ICommand = {
    data: new SlashCommandBuilder().setName("emojicount").setDescription("Get the total number of angry emojis sent."),
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        interaction.reply({ embeds: [await runCommand(interaction.user)] });
    },
    executeMessage: async (message: Message): Promise<void> => {
        message.reply({ embeds: [await runCommand()] });
    },
};
