import { type Collection, REST, Routes } from "discord.js";
import type { CommandHandler } from "../commands/types";

export async function registerApplicationCommands(
    token: string,
    clientId: string,
    commands: Collection<string, CommandHandler>,
) {
    const rest = new REST({ version: "10" }).setToken(token);

    // Will crash the bot if it fails
    await rest.put(Routes.applicationCommands(clientId), {
        body: commands.map((c) => c.data.toJSON()),
    });

    console.info(`Registered ${commands.size} commands for every guild.`);
}
