import { CommandInteraction, Message, MessageEmbed, User as DiscordUser } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { angryIconCDN, repoURL } from "@data";
import { ICommand } from "../command-interfaces";
import { createUser, User } from "@helpers";

export const pay: ICommand = {
    data: new SlashCommandBuilder()
        .setName("pay")
        .setDescription("Pay another user some angry coins.")
        .addUserOption(option => option.setName("user").setDescription("The user to pay.").setRequired(true))
        .addIntegerOption(option =>
            option.setName("amount").setDescription("The amount of angry coins to pay.").setRequired(true)
        ),
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        const from = interaction.user;
        const to = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");

        if (!to || !amount) {
            return;
        }

        interaction.reply({ embeds: [await runCommand(from, to, amount)] });
    },
    executeMessage: async (message: Message, args: string[]): Promise<void> => {
        const from = message.author;
        const to = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!to || !amount) {
            await message.reply("Invalid arguments.");
            return;
        }

        message.reply({ embeds: [await runCommand(from, to, amount)] });
    },
};

async function runCommand(from: DiscordUser, to: DiscordUser, amount: number) {
    if (from.id === to.id) {
        return new MessageEmbed().setColor("#ff4dde").setTitle("Haha, no.");
    }
    const fromUser = await User.findOne({ userId: from.id });
    let toUser = await User.findOne({ userId: to.id });

    const embed = new MessageEmbed().setTitle("Pay").setColor("YELLOW").setAuthor({
        name: "Angry",
        iconURL: angryIconCDN,
        url: repoURL,
    });

    if (!fromUser || fromUser.angryCoins < amount) {
        return embed.setColor("RED").setDescription("You don't have enough angry coins to pay that amount.");
    }

    if (!toUser) {
        toUser = await createUser(to);
    }

    fromUser.angryCoins -= amount;
    toUser.angryCoins += amount;

    await fromUser.save();
    await toUser.save();

    return embed.setDescription(`You paid **${amount}** angry coins to ${to.username}.`);
}
