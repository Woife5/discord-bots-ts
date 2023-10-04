import { CensorshipUtil } from "@helpers";
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { getUser } from "helpers/user.util";
import { CommandHandler } from "@woife5/shared/lib/commands/types.d";
import { infoEmbedColor } from "../embeds";

export const censored: CommandHandler = {
    data: new SlashCommandBuilder().setName("censored").setDescription("Get a list of censored strings."),
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        interaction.reply({ embeds: [await getCensoredEmbed()] });
    },
};

const defaultEmbed = () => {
    return new EmbedBuilder().setColor(infoEmbedColor).setTitle("No consored strings found!");
};

export async function getCensoredEmbed() {
    const c = await CensorshipUtil.loadAll();

    if (c.length <= 0) {
        return defaultEmbed();
    }

    const embed = defaultEmbed().setTitle("Censored Strings:");

    const owners = new Map<string, string>();
    for (const item of c) {
        if (!item.owner) {
            // skip items with no owner, these are currently not active or owned by anyone
            continue;
        }

        if (!owners.has(item.owner)) {
            owners.set(item.owner, `\`${item.value}\``);
        } else {
            owners.set(item.owner, `${owners.get(item.owner)}, \`${item.value}\``);
        }
    }

    for (const [owner, value] of owners) {
        const name = (await getUser(owner))?.userName ?? "Unknown";
        embed.addFields({ name, value });
    }

    return embed;
}
