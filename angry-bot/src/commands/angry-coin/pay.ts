import { angryCoinEmbed } from "commands/embeds";
import { ChatInputCommandInteraction, EmbedBuilder, User as DiscordUser, SlashCommandBuilder } from "discord.js";
import { getUserBalance, updateUserBalance } from "helpers/user.util";
import { CommandHandler } from "@woife5/shared/lib/commands/types.d";

export const pay: CommandHandler = {
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
};

async function runCommand(from: DiscordUser, to: DiscordUser, amount: number) {
    if (from.id === to.id || amount < 0) {
        return new EmbedBuilder().setColor("#ff4dde").setTitle("Haha, no.");
    }

    const embed = angryCoinEmbed().setTitle("Pay");

    if ((await getUserBalance(from.id)) < amount) {
        return embed.setDescription("You don't have enough angry coins to pay that amount.");
    }

    await updateUserBalance({ userId: from.id, amount: -amount, username: from.username });
    await updateUserBalance({ userId: to.id, amount, username: to.username });

    return embed.setDescription(`You paid **${amount}** angry coins to ${to.username}.`);
}
