import {
    type AudioPlayer,
    type DiscordGatewayAdapterCreator,
    createAudioPlayer,
    createAudioResource,
    getVoiceConnection,
    getVoiceConnections,
    joinVoiceChannel,
} from "@discordjs/voice";
import { getTarget } from "database/boller-target";
import type { Guild, Snowflake, VoiceState } from "discord.js";

let audioPlayer: AudioPlayer | null = null;

export async function handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
    // If there is a target and the current user is the target, the bot should always join the channel
    // If there is a target and the current user is not the target:
    // - The bot should join the channel if its not currently in a voice channel already
    // - The bot should join the channel if the user switched channels and the old channel is now empty
    // - The bot should leave if the user left and was the last user in the channel
    // If there is no target, the bot should join the channel only if the old channel is empty.

    const target = await getTarget();

    // new user joined a channel
    if (!oldState.channelId && newState.channelId) {
        const newGuildHasConnection = !!getVoiceConnection(newState.guild.id);

        // there is a target user
        if (target) {
            // target user joined a channel
            if (newState.member?.id === target.userId) {
                connectToChannel(newState.guild.id, newState.channelId, newState.guild.voiceAdapterCreator);
                return;
            }

            // its not the target user, but someone joined
            if (!newGuildHasConnection) {
                connectToChannel(newState.guild.id, newState.channelId, newState.guild.voiceAdapterCreator);
                return;
            }
        }

        // there is no target user
        if (!newGuildHasConnection) {
            connectToChannel(newState.guild.id, newState.channelId, newState.guild.voiceAdapterCreator);
            return;
        }
    }

    // user switched channels
    if (oldState.channelId && newState.channelId) {
        // there is a target user
        if (target) {
            // target user switched channels
            if (newState.member?.id === target.userId) {
                connectToChannel(newState.guild.id, newState.channelId, newState.guild.voiceAdapterCreator);
                return;
            }

            // its not the target user, but someone switched channels
            if (!getVoiceConnection(newState.guild.id)) {
                // if the bot is not in a voice channel, join the channel
                connectToChannel(newState.guild.id, newState.channelId, newState.guild.voiceAdapterCreator);
                return;
            }
        }

        // there is no target user

        // follow the user if the old channel is empty
        if (oldState.channel?.members.size === 1) {
            connectToChannel(newState.guild.id, newState.channelId, newState.guild.voiceAdapterCreator);
            return;
        }
    }

    // user left a channel
    if (oldState.channelId && !newState.channelId) {
        if (oldState.channel?.members.size === 1) {
            // only the bot is left in the vc
            disconnectFromGuild(oldState.guild);
            return;
        }
    }
}

function connectToChannel(guildId: Snowflake, channelId: Snowflake, adapterCreator: DiscordGatewayAdapterCreator) {
    const connection = joinVoiceChannel({ channelId, guildId, adapterCreator });

    if (!audioPlayer) {
        audioPlayer = createAudioPlayer();
        const audioResource = createAudioResource("https://ffn-stream21.radiohost.de/radiobollerwagen_mp3-192");
        audioPlayer.play(audioResource);
    }

    connection.subscribe(audioPlayer);
}

function disconnectFromGuild(guild: Guild) {
    const connection = getVoiceConnection(guild.id);
    if (!connection) {
        console.debug(`No active connection for guild ${guild.name}`);
        return;
    }

    console.debug(`Leaving voice channel in guild ${guild.name}`);
    connection.destroy();

    if (getVoiceConnections().size === 0) {
        console.debug("No active connections, stopping audio player");
        audioPlayer?.stop(true);
        audioPlayer = null;
    }
}
