/* eslint-disable no-console */
const { ANGRY1_TOKEN, CLIENT_ID } = process.env;

if (!ANGRY1_TOKEN || !CLIENT_ID) {
    console.error("Missing environment variables!");
    process.exit(1);
}

import { Bibleverse, Catgirl, Luhans, Tarot, Yesno } from "../commands";

import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";

const commands = [
    Bibleverse.slashCommandData.toJSON(),
    Catgirl.slashCommandData.toJSON(),
    Luhans.slashCommandData.toJSON(),
    Tarot.slashCommandData.toJSON(),
    Yesno.slashCommandData.toJSON(),
];

const rest = new REST({ version: "9" }).setToken(ANGRY1_TOKEN);

// Comment the next line out to register the commands on every guild (will take a while)
// const testGuilds = ['949336261057994882'];

// testGuilds.forEach(async guild => {
//     rest.put(Routes.applicationGuildCommands(CLIENT_ID, guild), { body: commands })
//         .then(() => console.log(`Successfully registered application commands on ${guild}.`))
//         .catch(console.error);
// });

rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })
    .then(() => console.log("Successfully registered application commands."))
    .catch(console.error)
    .finally(() => {
        process.exit(0);
    });
