import { CommandInteraction, Message, MessageEmbed, User as DiscordUser } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Stats, User } from "@helpers";

async function runCommand(user?: DiscordUser) {
    let emojicount = 0;

    if (user) {
        const userResult = await User.findOne({ userId: user.id }).exec();

        if (!userResult) {
            return new MessageEmbed().setColor("#d94d26").setTitle("User not found!");
        }

        emojicount = Object.values(userResult.emojis).reduce((acc, val) => acc + val, 0);
    } else {
        const val = await Stats.findOne({ key: "total-angry-emojis-sent" }).exec();

        if (!val) {
            return new MessageEmbed().setColor("#d94d26").setTitle("Error 🤒");
        }

        emojicount = val.value;
    }

    return new MessageEmbed()
        .setColor("#d94d26")
        .setTitle("Emoji Stats")
        .addField(`${user ? "Your t" : "T"}otal emoji cout`, `${emojicount}`);
}

export const name = "emojicount";

export const slashCommandData = new SlashCommandBuilder().setName(name).setDescription("Not yet implemented.");

export async function executeInteraction(interaction: CommandInteraction) {
    await interaction.reply({ embeds: [await runCommand(interaction.user)] });
}

export async function executeMessage(message: Message) {
    await message.reply({ embeds: [await runCommand(message.author)] });
}
