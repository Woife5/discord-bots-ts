import type { ChatInputCommandInteraction, Message } from "discord.js";
import type { SlashCommandBuilder } from "@discordjs/builders";

export type CommandHandler = {
    data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
    executeInteraction: (interaction: ChatInputCommandInteraction) => Promise<void> | void;
};

export enum Role {
    USER,
    ADMIN,
    OWNER,
}
