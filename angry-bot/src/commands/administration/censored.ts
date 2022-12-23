import { SlashCommandBuilder } from "@discordjs/builders";
import { CensorshipUtil } from "@helpers";
import { CommandInteraction, EmbedBuilder, Message } from "discord.js";
import { getUser } from "helpers/user.util";
import { CommandHandler } from "shared/lib/commands/types.d";

export const censored: CommandHandler = {
    data: new SlashCommandBuilder().setName("censored").setDescription("Get a list of censored strings."),
    executeInteraction: async (interaction: CommandInteraction): Promise<void> => {
        interaction.reply({ embeds: [await getCensoredEmbed()] });
    },
    executeMessage: async (message: Message): Promise<void> => {
        message.reply({ embeds: [await getCensoredEmbed()] });
    },
};

const defaultEmbed = () => {
    return new EmbedBuilder().setColor("#d94d26").setTitle("No consored strings found!");
};

export async function getCensoredEmbed() {
    const c = await CensorshipUtil.loadAll();

    if (c.length <= 0) {
        return defaultEmbed();
    }

    const embed = defaultEmbed().setTitle("Censored Strings:");

    const owners = new Map<string, string>();
    for (const item of c) {
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
