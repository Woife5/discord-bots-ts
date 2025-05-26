import type { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { type ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { bollerwagenLogoUrl, defaultEmbed } from "./embeds";

type Song = {
    start: number;
    title: string;
    artist: string;
    cover: string;
};

type QueueResponse = {
    currentTime: number;
    // contains 6 songs, some in the future and some in the past, can be determined by comparing the start time with the current time
    songs: Array<Song>;
};

const baseUrl = "https://www.ffn.de/fileadmin/";
const currentQueueUrl = `${baseUrl}content/playlist-xml/radiobollerwagen.json`;

export const playing: CommandHandler = {
    data: new SlashCommandBuilder().setName("playing").setDescription("Get a list of the currently played songs."),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const response = await fetch(currentQueueUrl);
        if (!response.ok) {
            await interaction.reply({ content: "Error fetching queue data", ephemeral: true });
            return;
        }
        const data = (await response.json()) as QueueResponse;

        await interaction.reply({ embeds: [runCommand(data)] });
    },
};

function runCommand(data: QueueResponse) {
    // sort the songs again just in case they are not always sorted
    data.songs.sort((a, b) => b.start - a.start);

    const currentSong = data.songs.find((song) => song.start <= data.currentTime);

    if (!currentSong) {
        return defaultEmbed()
            .setThumbnail(bollerwagenLogoUrl)
            .setDescription("No song is currently playing.")
            .setTimestamp(data.currentTime * 1000);
    }

    const nextStartTime = new Date(data.songs[0].start * 1000);

    return defaultEmbed()
        .setThumbnail(baseUrl + currentSong?.cover)
        .addFields([
            {
                name: currentSong?.title,
                value: `by ${currentSong?.artist} is currently playing.`,
            },
            {
                name: "Next up",
                value: `${data.songs[0].title} by ${data.songs[0].artist} at ${nextStartTime.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Vienna" })}`,
            },
        ])
        .setTimestamp(data.currentTime * 1000);
}
