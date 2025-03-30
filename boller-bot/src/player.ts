import {
    AudioPlayer,
    AudioResource,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    VoiceConnection,
} from '@discordjs/voice';
import type { VoiceState } from 'discord.js';

type GuildChannelConnection = {
    guildId: string;
    channelId: string;
    connection: VoiceConnection;
    player: AudioPlayer;
    resource: AudioResource;
};

const activeConnections = new Map<string, GuildChannelConnection>();
// let audioPlayer: AudioPlayer | null = null;

export function memberJoin(state: VoiceState) {
    if (!state.channelId) return;

    const channelId = state.channelId;

    console.debug(`User ${state.member?.user.username} joined channel ${state.channelId}`);
    const connection = joinVoiceChannel({
        channelId,
        guildId: state.guild.id,
        adapterCreator: state.guild.voiceAdapterCreator,
    });

    console.debug(`Creating audio player for channel ${channelId}`);
    const audioPlayer = createAudioPlayer();
    const audioResource = createAudioResource('https://ffn-stream21.radiohost.de/radiobollerwagen_mp3-192');
    audioPlayer.play(audioResource);

    connection.subscribe(audioPlayer);

    activeConnections.set(channelId, {
        guildId: state.guild.id,
        channelId,
        connection,
        player: audioPlayer,
        resource: audioResource,
    });
}

export function memberLeave(oldState: VoiceState, newState: VoiceState) {
    if (!oldState.channelId) return;

    console.debug(`User ${oldState.member?.user.username} left channel ${oldState.channelId}`);

    if (!activeConnections.has(oldState.channelId)) {
        console.debug(`No active connection for channel ${oldState.channelId}`);
        return;
    }

    if (newState.channel?.members.size ?? 0 > 1) {
        console.debug(`Channel ${oldState.channelId} still has members, not leaving`);
        return;
    }

    console.debug(`Channel ${oldState.channelId} is empty, leaving`);
    const guildConnection = activeConnections.get(oldState.channelId)!;
    guildConnection.player.stop(true);
    guildConnection.connection.destroy();
    activeConnections.delete(oldState.channelId);
}
