import { Snowflake } from "discord.js";

type Target = {
    name: string | null;
    id: Snowflake | null;
}

export const bollerTarget: Target = {
    name: null,
    id: null,
}