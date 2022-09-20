import { CommandInteraction, Message, MessageEmbed, User as DiscordUser } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { angryIconCDN, repoURL } from "@data";
import { ICommand } from "../command-interfaces";
import { getUserCurrency, incrementStatAndUser, NumberUtils, User } from "@helpers";

export const gamble: ICommand = {
    data: new SlashCommandBuilder()
        .setName("gamble")
        .setDescription("Gamble away a portion of your angry coins.")
        .addIntegerOption(option =>
            option.setName("amount").setDescription("The amount of angry coins to gamble.").setRequired(true)
        ),
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        const amount = interaction.options.getInteger("amount") ?? -1;
        interaction.reply({ embeds: [await runCommand(interaction.user, amount)] });
    },
    executeMessage: async (message: Message, args: string[]): Promise<void> => {
        const amount = parseInt(args[0]) || -1;
        message.reply({ embeds: [await runCommand(message.author, amount)] });
    },
};

async function runCommand(user: DiscordUser, amount: number) {
    const userBalance = await getUserCurrency(user.id);

    if (amount <= 0 || amount > userBalance) {
        return new MessageEmbed()
            .setColor("RED")
            .setTitle("Gamble")
            .setDescription(
                "Invalid amount! You have to gamble a positive amount of coins that you own (debt maybe coming soon)."
            )
            .setAuthor({
                name: "Angry",
                iconURL: angryIconCDN,
                url: repoURL,
            });
    }

    const embed = new MessageEmbed()
        .setColor("YELLOW")
        .addField("Gambling", `You gambled ${amount} angry coins`)
        .setAuthor({
            name: "Angry",
            iconURL: angryIconCDN,
            url: repoURL,
        });

    const loose = NumberUtils.getRandomInt(0, 1) !== 0;
    await updateBalance(user, loose ? -amount : amount);

    if (loose) {
        embed.setColor("RED");
        embed.addField("Outcome", "You lost all your coins :( Better luck next time!");
        return embed;
    }

    embed.setColor("GREEN");
    embed.addField(
        "Outcome",
        `You won ${amount * 2} angry coins! Good job! :money_mouth: :moneybag::moneybag::moneybag:`
    );
    return embed;
}

async function updateBalance(discordUser: DiscordUser, amount: number) {
    await User.updateOne({ userId: process.env.CLIENT_ID }, { $inc: { angryCoins: -amount } }, { upsert: true }).exec();
    await User.updateOne({ userId: discordUser.id }, { $inc: { angryCoins: amount } }).exec();
    if (amount < 0) {
        await incrementStatAndUser("money-lost-in-gambling", discordUser, -amount);
    } else {
        await incrementStatAndUser("money-won-in-gambling", discordUser, amount);
    }
}
