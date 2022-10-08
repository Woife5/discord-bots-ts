import { ChatInputCommandInteraction, Message, EmbedBuilder, User as DiscordUser } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { angryIconCDN, repoURL } from "@data";
import { ICommand } from "../command-interfaces";
import { getUserCurrency, updateUserBalance } from "@helpers";

export const pay: ICommand = {
    data: new SlashCommandBuilder()
        .setName("pay")
        .setDescription("Pay another user some angry coins.")
        .addUserOption(option => option.setName("user").setDescription("The user to pay.").setRequired(true))
        .addIntegerOption(option =>
            option.setName("amount").setDescription("The amount of angry coins to pay.").setRequired(true)
        ),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const from = interaction.user;
        const to = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");

        if (!to || amount == undefined) {
            return;
        }

        interaction.reply({ embeds: [await runCommand(from, to, amount)] });
    },
    executeMessage: async (message: Message, args: string[]): Promise<void> => {
        const from = message.author;
        const to = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!to || amount == undefined) {
            await message.reply("Invalid arguments.");
            return;
        }

        message.reply({ embeds: [await runCommand(from, to, amount)] });
    },
};

async function runCommand(from: DiscordUser, to: DiscordUser, amount: number) {
    if (from.id === to.id || amount < 0) {
        return new EmbedBuilder().setColor("#ff4dde").setTitle("Haha, no.");
    }

    const embed = new EmbedBuilder().setTitle("Pay").setColor("Yellow").setAuthor({
        name: "Angry",
        iconURL: angryIconCDN,
        url: repoURL,
    });

    if ((await getUserCurrency(from.id)) < amount) {
        return embed.setColor("Red").setDescription("You don't have enough angry coins to pay that amount.");
    }

    await updateUserBalance({ userId: from.id, amount: -amount, username: from.username });
    await updateUserBalance({ userId: to.id, amount, username: to.username });

    return embed.setDescription(`You paid **${amount}** angry coins to ${to.username}.`);
}
