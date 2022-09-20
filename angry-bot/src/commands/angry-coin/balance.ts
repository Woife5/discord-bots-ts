import { CommandInteraction, Message, MessageEmbed, User } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { angryIconCDN, repoURL } from "@data";
import { ICommand } from "../command-interfaces";
import { getUserCurrency } from "@helpers";

export const balance: ICommand = {
    data: new SlashCommandBuilder().setName("balance").setDescription("Check your current angry coin balance."),
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        interaction.reply({ embeds: [await runCommand(interaction.user)], ephemeral: true });
    },
    executeMessage: async (message: Message): Promise<void> => {
        message.reply({ embeds: [await runCommand(message.author)] });
    },
};

async function runCommand(user: User) {
    const userBalance = await getUserCurrency(user.id);

    return new MessageEmbed()
        .setColor("YELLOW")
        .addField("Current Balance", `Your current balance is: ${userBalance} angry coins.`)
        .setAuthor({
            name: "Angry",
            iconURL: angryIconCDN,
            url: repoURL,
        });
}
