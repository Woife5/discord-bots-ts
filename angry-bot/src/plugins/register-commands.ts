import { REST } from "@discordjs/rest";
import { Log } from "@helpers";
import { Routes } from "discord-api-types/v10";
import { Collection } from "discord.js";
import { CommandHandler } from "shared/lib/commands/types";

const log = new Log("RegisterCommands");

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

    log.info(`Registered ${commands.size} commands for every guild.`, "registerApplicationCommands");
}
