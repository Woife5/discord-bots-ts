import { ChatInputCommandInteraction, Message, EmbedBuilder, User as DiscordUser } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { angryIconCDN, repoURL } from "@data";
import { ICommand } from "../command-interfaces";
import { incrementStatAndUser } from "@helpers";
import { getRandomInt } from "shared/lib/utils/number.util";
import { getUserActionCache, getUserBalance, updateUserActionCache, updateUserBalance } from "helpers/user.util";

export const gamble: ICommand = {
    data: new SlashCommandBuilder()
        .setName("gamble")
        .setDescription("Gamble away a portion of your angry coins.")
        .addStringOption(option =>
            option
                .setName("amount")
                .setDescription("The amount of coins you want to gamble or `all`, if you are feeling very lucky ;)")
                .setRequired(true)
        ),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const amountStr = interaction.options.getString("amount") ?? "";
        const amount = parseInt(amountStr, 10);

        const all = amountStr === "all";

        interaction.reply({ embeds: [await runCommand(interaction.user, amount, all)] });
    },
    executeMessage: async (message: Message, args: string[]): Promise<void> => {
        const amount = parseInt(args[0] ?? "", 10);
        const all = args[0] === "all";

        message.reply({ embeds: [await runCommand(message.author, amount, all)] });
    },
};

async function runCommand(user: DiscordUser, amount: number, all: boolean) {
    const userBalance = await getUserBalance(user.id);

    if (all) {
        amount = userBalance;
    }

    if (isNaN(amount) || amount <= 0 || amount > userBalance) {
        return new EmbedBuilder()
            .setColor("Red")
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

    const embed = new EmbedBuilder()
        .setColor("Yellow")
        .addFields({ name: "Gambling", value: `You gambled ${amount} angry coins` })
        .setAuthor({
            name: "Angry",
            iconURL: angryIconCDN,
            url: repoURL,
        });

    let upperLimit = 1;

    const userCache = getUserActionCache(user.id);
    if (userCache && userCache.gambles > 4) {
        upperLimit = 7;
    }
    updateUserActionCache(user.id, { gambles: 1 });

    const win = getRandomInt(0, upperLimit) === 0;
    const taxPayed = !win && amount >= userBalance / 10;
    await updateBalance(user, win ? amount : -amount, taxPayed);

    if (win) {
        embed.setColor("Green");
        embed.addFields({
            name: "Outcome",
            value: `You won ${amount * 2} angry coins! Good job! :money_mouth: :moneybag::moneybag::moneybag:`,
        });
        return embed;
    }

    embed.setColor("Red");
    embed.addFields({ name: "Outcome", value: "You lost all your coins :( Better luck next time!" });
    return embed;
}

async function updateBalance(discordUser: DiscordUser, amount: number, taxPayed: boolean) {
    await updateUserBalance({ userId: discordUser.id, amount, username: discordUser.username, taxPayed });
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await updateUserBalance({ userId: process.env.CLIENT_ID!, amount: -amount, username: "Angry" });
    if (amount < 0) {
        await incrementStatAndUser("money-lost-in-gambling", discordUser, -amount);
    } else {
        await incrementStatAndUser("money-won-in-gambling", discordUser, amount);
    }
}
