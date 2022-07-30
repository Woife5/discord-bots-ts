import type { CommandInteraction, Message, User } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { User as DbUser, createUser } from "@helpers";
import { ICommand } from "./command-interfaces";

async function updateReminder(user: User, subcommand: "enable" | "disable") {
    let dbUser = await DbUser.findOne({ userId: user.id }).exec();

    if (!dbUser) {
        dbUser = await createUser(user);
    }

    dbUser.tarotreminder = subcommand === "enable";
    await dbUser.save();
}

export const tarotreminder: ICommand = {
    data: new SlashCommandBuilder().setName("tarotreminder").setDescription("Enable/disable the tarot reminder."),
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        // TODO: Implement subcommand for interactions
        const subcommand = "enable";

        if (subcommand === "enable") {
            await updateReminder(interaction.user, "enable");
            interaction.reply("Tarot reminder enabled!");
        } else if (subcommand === "disable") {
            await updateReminder(interaction.user, "disable");
            interaction.reply("Tarot reminder disabled!");
        } else {
            interaction.reply("Invalid subcommand!");
        }
    },
    executeMessage: async (message: Message, args: string[]): Promise<void> => {
        if (args.length === 0) {
            message.reply("No arguments provided!");
            return;
        }

        if (args[0] === "enable" || args[0] === "disable") {
            await updateReminder(message.author, args[0]);
            message.reply(`Tarot reminder ${args[0]}d`);
            return;
        }

        message.reply("Invalid argument!");
    },
};
