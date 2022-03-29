import { CommandInteraction, Interaction } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

export namespace Bible {
    interface IBookNames {
        [key: string]: number;
    }

    interface IBibleVerse {
        chapter: number;
        verse: number;
        name: string;
        text: string;
    }

    interface IBibleChapter {
        chapter: number;
        name: string;
        verses: IBibleVerse[];
    }

    interface IBibleBook {
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
    execute: (interaction: CommandInteraction) => void;
}
