import { CommandHandler } from "../commands/types";
import { Collection, REST, Routes } from "discord.js";

export async function registerApplicationCommands(
    token: string,
    clientId: string,
    commands: Collection<string, CommandHandler>
) {
    const rest = new REST({ version: "10" }).setToken(token);

    // Will crash the bot if it fails
    await rest.put(Routes.applicationCommands(clientId), {
        body: commands.map(c => c.data.toJSON()),
    });

    // eslint-disable-next-line no-console
    console.info(`Registered ${commands.size} commands for every guild.`);
}
