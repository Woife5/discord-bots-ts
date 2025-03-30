import {
    AudioPlayer,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    VoiceConnection,
} from '@discordjs/voice';
import type { VoiceState } from 'discord.js';

const activeConnections = new Map<string, VoiceConnection>();
let audioPlayer: AudioPlayer | null = null;

export function memberJoin(state: VoiceState) {
    if (!state.channelId) return;

    console.debug(`User ${state.member?.user.username} joined channel ${state.channel?.name}`);
    const connection = joinVoiceChannel({
        channelId: state.channelId,
        guildId: state.guild.id,
        adapterCreator: state.guild.voiceAdapterCreator,
    });

    activeConnections.set(state.guild.id, connection);

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

    if (!activeConnections.has(oldState.guild.id)) {
        console.debug(`No active connection for channel ${oldState.guild.name}`);
        return;
    }

    if (newState.channel?.members.size ?? 0 > 1) {
        console.debug(`Channel ${oldState.channel?.name} still has members, not leaving`);
        return;
    }

    console.debug(`Channel ${oldState.channel?.name} is empty, leaving`);
    const connection = activeConnections.get(oldState.guild.id)!;
    connection.destroy();
    activeConnections.delete(oldState.channelId);

    if (activeConnections.size === 0) {
        console.debug(`No active connections, stopping audio player`);
        audioPlayer?.stop(true);
        audioPlayer = null;
    }
}

export function memberMove(oldState: VoiceState, newState: VoiceState) {
    if (!oldState.channelId || !newState.channelId) return;

    console.debug(
        `User ${oldState.member?.user.username} moved from channel ${oldState.channel?.name} to ${newState.channel?.name}`
    );

    const newConnection = joinVoiceChannel({
        channelId: newState.channelId,
        guildId: newState.guild.id,
        adapterCreator: oldState.guild.voiceAdapterCreator,
    });

    activeConnections.set(newState.guild.id, newConnection);
}
