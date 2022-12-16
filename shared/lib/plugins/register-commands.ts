import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { Collection } from "discord.js";
import { CommandHandler } from "shared/lib/commands/types.d";

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
    console.info(`Registered ${commands.size} commands for every guild.`, "registerApplicationCommands");
}
