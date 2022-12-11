import {
    ChatInputCommandInteraction,
    Message,
    EmbedBuilder,
    User as DiscordUser,
    PermissionFlagsBits,
} from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { angryIconCDN, repoURL } from "@data";
import { ICommand, Role } from "../command-interfaces";
import { UserUtils } from "@helpers";

export const payout: ICommand = {
    data: new SlashCommandBuilder()
        .setName("payout")
        .setDescription("Distribute the earned angry coins to the users.")
        .addStringOption(option =>
            option.setName("amount").setDescription("The amount of coins to distribute or `all`.").setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    role: Role.OWNER,
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const amountStr = interaction.options.getString("amount") ?? "";
        const amount = parseInt(amountStr, 10);
        const all = amountStr === "all";

        if ((await UserUtils.getUserRole(interaction.user, interaction.guild)) !== Role.OWNER) {
            interaction.reply({ content: "You don't have permission to do this!", ephemeral: true });
            return;
        }

        interaction.reply({ embeds: [await runCommand(interaction.user, amount, all)] });
    },
    executeMessage: async (message: Message, args: string[]): Promise<void> => {
        const amount = parseInt(args[0] ?? "", 10);
        const all = args[0] === "all";

        message.reply({ embeds: [await runCommand(message.author, amount, all)] });
    },
};

async function runCommand(user: DiscordUser, amount: number, all: boolean) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const botBalance = await UserUtils.getUserBalance(process.env.CLIENT_ID!);

    if (all) {
        amount = botBalance;
    }

    if (isNaN(amount) || amount <= 0 || amount > botBalance) {
        return new EmbedBuilder()
            .setColor("Yellow")
            .setTitle("Payout")
            .setDescription("The selected amount is not valid, please select a valid, positive integer or `all`.")
            .setAuthor({
                name: "Angry",
                iconURL: angryIconCDN,
                url: repoURL,
            });
    }

    const embed = new EmbedBuilder()
        .setColor("Yellow")
        .addFields({ name: "Payout", value: `The amount of ${amount} coins has been payed to ${user.username}` })
        .setAuthor({
            name: "Angry",
            iconURL: angryIconCDN,
            url: repoURL,
        });

    await updateBalance(user, amount);

    return embed;
}

async function updateBalance(discordUser: DiscordUser, amount: number) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await UserUtils.updateUserBalance({ userId: process.env.CLIENT_ID!, amount: -amount, username: "Angry" });
    await UserUtils.updateUserBalance({ userId: discordUser.id, amount, username: discordUser.username });
}
