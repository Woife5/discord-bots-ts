import type { SlashCommandOptionsOnlyBuilder } from "@discordjs/builders";
import type { ChatInputCommandInteraction } from "discord.js";

export type CommandHandler = {
    data: SlashCommandOptionsOnlyBuilder | Omit<SlashCommandOptionsOnlyBuilder, "addSubcommand" | "addSubcommandGroup">;
    executeInteraction: (interaction: ChatInputCommandInteraction) => Promise<void> | void;
};

export enum Role {
    USER = 0,
    ADMIN = 1,
    OWNER = 2,
}
