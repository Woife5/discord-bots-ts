import {
    AudioPlayer,
    createAudioPlayer,
    createAudioResource,
    getVoiceConnection,
    getVoiceConnections,
    joinVoiceChannel,
} from '@discordjs/voice';
import { bollerTarget } from 'database/boller-target';
import type { VoiceState } from 'discord.js';

let audioPlayer: AudioPlayer | null = null;

export function memberJoin(state: VoiceState) {
    if (!state.channelId) return;

    if (state.member?.id !== bollerTarget.id) {
        return;
    }

    console.debug(`User ${state.member?.user.username} joined channel ${state.channel?.name}`);
    const connection = joinVoiceChannel({
        channelId: state.channelId,
        guildId: state.guild.id,
        adapterCreator: state.guild.voiceAdapterCreator,
    });

    if (!audioPlayer) {
        audioPlayer = createAudioPlayer();
        const audioResource = createAudioResource('https://ffn-stream21.radiohost.de/radiobollerwagen_mp3-192');
        audioPlayer.play(audioResource);
    }

    connection.subscribe(audioPlayer);
}

export function memberLeave(oldState: VoiceState, newState: VoiceState) {
    if (!oldState.channelId) return;

    console.debug(`User ${oldState.member?.user.username} left channel ${oldState.channel?.name}`);

    const connection = getVoiceConnection(oldState.guild.id);
    if (!connection) {
        console.debug(`No active connection for guild ${oldState.guild.name}`);
        return;
    }

    if (newState.channel?.members.size ?? 0 > 1) {
        console.debug(`Channel ${oldState.channel?.name} still has members, not leaving`);
        return;
    }

    console.debug(`Channel ${oldState.channel?.name} is empty, leaving`);
    connection.destroy();

    if (getVoiceConnections().size === 0) {
        console.debug(`No active connections, stopping audio player`);
        audioPlayer?.stop(true);
        audioPlayer = null;
    }
}
