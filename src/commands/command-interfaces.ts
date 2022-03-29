import { CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

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
    translation: 'Elberfelder (1871)';
    abbreviation: 'elberfelder';
    lang: 'de';
    language: 'German';
    direction: 'LTR';
    encoding: 'UTF-8';
    nr: number;
    name: string;
    chapters: IBibleChapter[];
}

export namespace Tarot {
    interface ITarot {
        text: string;
        media?: string;
    }
}

export namespace Yesno {
    interface IYesNo {
        answer: 'yes' | 'no' | 'maybe';
        forced: boolean;
        image: string;
    }
}

export namespace Catgirl {
    interface ICatgirlImage {
        id: string;
        originalHash: string;
        tags: string[];
        nsfw: boolean;
        createdAt: string;
    }

    interface ICatgirlResponse {
        images: ICatgirlImage[];
    }
}

export interface ICommand {
    data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
    executeInteraction: (interaction: CommandInteraction) => void;
    executeMessage: (message: Message, args: string[]) => void;
}
