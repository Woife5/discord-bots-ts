import { Snowflake } from "discord.js";

type Target = {
    guildId: Snowflake | null;
    name: string | null;
    id: Snowflake | null;
}

export const bollerTarget: Target = {
    guildId: null,
    name: null,
    id: null,
}