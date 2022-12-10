import { ChatInputCommandInteraction, Message } from "discord.js";
import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "@discordjs/builders";

export interface IBookNames {
    [key: string]: number;
}

export interface IBibleVerse {
    chapter: number;
    verse: number;
    name: string;
    text: string;
}

export interface IBibleChapter {
    chapter: number;
    name: string;
    verses: IBibleVerse[];
}

export interface IBibleBook {
    translation: "Elberfelder (1871)";
    abbreviation: "elberfelder";
    lang: "de";
    language: "German";
    direction: "LTR";
    encoding: "UTF-8";
    nr: number;
    name: string;
    chapters: IBibleChapter[];
}

export interface ITarot {
    text: string;
    media?: string;
}

export interface IYesNo {
    answer: "yes" | "no" | "maybe";
    forced: boolean;
    image: string;
}

export interface ICatgirlImage {
    id: string;
    originalHash: string;
    tags: string[];
    nsfw: boolean;
    createdAt: string;
}

export interface ICatgirlResponse {
    images: ICatgirlImage[];
}

export interface ICatboyPhraseResponse {
    response: string;
    error: string;
}

export interface ICatboyResponse {
    url: string;
    artist: string;
    artist_url: string;
    source_url: string;
    error: string;
}

export interface ISlashCommand {
    (interaction: ChatInputCommandInteraction): void | Promise<void>;
}

export interface IMessageCommand {
    (message: Message, args: string[]): void | Promise<void>;
}

export interface ICommand {
    data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
    role?: Role;
    executeInteraction: ISlashCommand;
    executeMessage: IMessageCommand;
}

export enum Role {
    USER,
    ADMIN,
    OWNER,
}
