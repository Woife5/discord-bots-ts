import { ChannelType } from "discord.js";

/**
 * Channel types that can be registered for summaries.
 *
 * Thread types are intentionally absent: messages inside a thread are rolled
 * up into the thread's parent, so registering a forum or text channel already
 * covers its threads while registering a thread directly never would match.
 */
export const SUMMARIZABLE_CHANNEL_TYPES = [
    ChannelType.GuildText,
    ChannelType.GuildAnnouncement,
    ChannelType.GuildForum,
    ChannelType.GuildMedia,
    ChannelType.GuildVoice,
    ChannelType.GuildStageVoice,
] as const;

/**
 * Channel types the daily summary can be posted into. Forum and media
 * channels only contain threads and cannot receive plain messages, so they
 * can be watched for DM summaries but not host a channel summary.
 */
export const POSTABLE_CHANNEL_TYPES = [
    ChannelType.GuildText,
    ChannelType.GuildAnnouncement,
    ChannelType.GuildVoice,
    ChannelType.GuildStageVoice,
] as const;
