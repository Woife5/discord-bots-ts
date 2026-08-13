import type { Client, GuildBasedChannel, Snowflake } from "discord.js";

/**
 * Resolves via fetch rather than the cache, which is not guaranteed to hold
 * the channel by the time a delayed summary runs.
 */
export async function resolveChannel(client: Client<true>, guildId: Snowflake, channelId: Snowflake) {
    const guild = await client.guilds.fetch(guildId);
    const channel: GuildBasedChannel | null = await guild.channels.fetch(channelId);

    if (!channel) {
        throw new Error(`Could not resolve guild channel ${channelId}`);
    }

    return { guild, channel };
}
