import type { CommandInteraction, Message, User } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { User as DbUser, createUser } from "@helpers";
import { CommandHandler } from "shared/lib/commands/types";

export const tarotreminder: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("tarotreminder")
        .setDescription("Enable/disable the tarot reminder.")
        .addStringOption(option =>
            option
                .setName("action")
                .setDescription("Enable or disable the reminder.")
                .setRequired(true)
                .addChoices({ name: "Enable", value: "enable" }, { name: "Disable", value: "disable" })
        ),
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        const subcommand = (interaction.options.get("action")?.value as "enable" | "disable") ?? "enable";

        await updateReminder(interaction.user, subcommand);
        if (subcommand === "enable") {
            interaction.reply("Tarot reminder enabled!");
        } else {
            interaction.reply("Tarot reminder disabled!");
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

async function updateReminder(user: User, subcommand: "enable" | "disable") {
    let dbUser = await DbUser.findOne({ userId: user.id }).exec();

    if (!dbUser) {
        dbUser = await createUser(user);
    }

    dbUser.tarotreminder = subcommand === "enable";
    await dbUser.save();
}
