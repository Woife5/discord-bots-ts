import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { angryIconCDN, repoURL, version } from "angry-bot/src/data";

function runCommand() {
    return new MessageEmbed()
        .setColor("#d94d26")
        .setTitle("About")
        .addField(
            "Invite me to your server:",
            "https://discord.com/api/oauth2/authorize?client_id=889871547152617542&permissions=0&scope=bot%20applications.commands"
        )
        .addField(
            "Slash Commands",
            "This bot uses Slash Commands! Just type a '/' and have a look at all the commands! 😡"
        )
        .setAuthor({
            name: "Angry",
            iconURL: angryIconCDN,
            url: repoURL,
        })
        .setFooter({
            text: `Angrier Bot v${version}`,
        });
}

export const name = "about";

export const slashCommandData = new SlashCommandBuilder()
    .setName(name)
    .setDescription("Get information about Angrier.");

export async function executeInteraction(interaction: CommandInteraction) {
    await interaction.reply({ embeds: [runCommand()] });
}

export async function executeMessage(message: Message) {
    await message.reply({ embeds: [runCommand()] });
}
