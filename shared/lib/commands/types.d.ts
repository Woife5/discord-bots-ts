import type { ChatInputCommandInteraction } from "discord.js";
import type { SlashCommandOptionsOnlyBuilder } from "@discordjs/builders";

export type CommandHandler = {
    data: SlashCommandOptionsOnlyBuilder | Omit<SlashCommandOptionsOnlyBuilder, "addSubcommand" | "addSubcommandGroup">;
    executeInteraction: (interaction: ChatInputCommandInteraction) => Promise<void> | void;
};

export enum Role {
    USER,
    ADMIN,
    OWNER,
}
