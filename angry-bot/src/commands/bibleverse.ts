import { bookNames } from "@data";
import { SlashCommandBuilder } from "@discordjs/builders";
import { incrementStatAndUser, Log } from "@helpers";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import fetch from "node-fetch";
import { CommandHandler } from "shared/lib/commands/types.d";
import { getRandomInt } from "shared/lib/utils/number.util";
import { IBibleBook } from "./command-interfaces";

const log = new Log("Bibleverse");

const bibleAPI = "https://getbible.net/v2/akjv/";
const numberOfBooks = 66;

export const bibleverse: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("bibleverse")
        .setDescription("Get a random bible verse. Optionally via the arguments a specific verse can be requested.")
        .addStringOption(option =>
            option
                .setName("book")
                .setDescription("The name or number of the book within the bible (1-66).")
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName("chapter").setDescription("The number of the chapter.").setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName("verse").setDescription("The number of the verse.").setRequired(false)
        ),
    executeInteraction: async (interaction: ChatInputCommandInteraction) => {
        const int_book = interaction.options.getString("book");
        const int_chapter = interaction.options.getNumber("chapter");
        const int_verse = interaction.options.getNumber("verse");

        await interaction.reply({ embeds: [await runCommand(int_book, int_chapter, int_verse)] });
        await incrementStatAndUser("bibleverses-requested", interaction.user);
    },
};

async function runCommand(
    int_book: string | null,
    int_chapter: number | null,
    int_verse: number | null
): Promise<EmbedBuilder> {
    // Check provided book
    let bookNumber: number;
    if (int_book) {
        if (isNaN(Number(int_book))) {
            // Check if int_book is a valid book name
            bookNumber = bookNames[int_book.toLowerCase()];
            if (!bookNumber) {
                return new EmbedBuilder().setTitle("Invalid book name!");
            }
        } else {
            // Check if the provided book number is valid
            if (Number(int_book) < 1 || Number(int_book) > numberOfBooks) {
                return new EmbedBuilder().setTitle("Invalid book number!");
            } else {
                bookNumber = Number(int_book);
            }
        }
    } else {
        // No book defined, get a random book number
        bookNumber = getRandomInt(1, numberOfBooks);
    }
    // end of book check

    // Download provided book
    let book: IBibleBook;
    try {
        const response = await fetch(`${bibleAPI}${bookNumber}.json`);
        book = (await response.json()) as IBibleBook;
    } catch (error) {
        log.error(error);
        return new EmbedBuilder().setTitle("Error while downloading the bible!");
    }

    // Check provided chapter
    let chapterNumber: number;
    if (int_chapter) {
        if (book.chapters.length >= int_chapter && int_chapter > 0) {
            chapterNumber = Number(int_chapter);
        } else {
            return new EmbedBuilder().setTitle("Invalid chapter number!");
        }
    } else {
        // No chapter defined, get a random chapter number
        chapterNumber = getRandomInt(1, book.chapters.length);
    }
    // end of chapter check

    // Check provided verse
    let verseNumber: number;
    if (int_verse) {
        if (book.chapters[chapterNumber - 1].verses.length >= int_verse && int_verse > 0) {
            verseNumber = int_verse;
        } else {
            return new EmbedBuilder().setTitle("Invalid verse number!");
        }
    } else {
        // No verse defined, get a random verse number
        verseNumber = getRandomInt(1, book.chapters[chapterNumber - 1].verses.length);
    }
    // end of verse check

    let verseText = book.chapters[chapterNumber - 1].verses[verseNumber - 1].text;

    // Replace some words in the text with some random others
    const randomNumber = Math.sin(((bookNumber << 4) + (chapterNumber << 2) + verseNumber) * 66.6);
    if (randomNumber > 0) {
        for (const [pattern, replacement] of toReplace) {
            verseText = verseText.replace(new RegExp(pattern, "ig"), `**${replacement}**`);
        }
    }

    return new EmbedBuilder()
        .setColor("Yellow")
        .setTitle("Bible Verse")
        .setDescription(verseText)
        .setFooter({
            text: `${book.name} ${chapterNumber}:${verseNumber}`,
        });
}

const toReplace: [string, string][] = [
    ["king", "Paul"],
    ["lord", "Paul"],
    ["god", "Angry"],
    ["christ", "Felix"],
    ["priest", "Axel"],
    ["angel", "Axel"],
    ["moses", "Valentin"],
    ["mary", "Vali"],
    ["sinner", "Thomas"],
    ["servants", "children"],
    ["jesus christ", "Wolfgang Rader"],
];
