import { describeSchedule, getNextStart, type ISpam, isValidDayOfMonth, SpamDB, type SpamUnit } from "@helpers";
import type { CommandHandler } from "@woife5/shared";
import {
    type AutocompleteInteraction,
    ChannelType,
    type ChatInputCommandInteraction,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";
import mongoose from "mongoose";
import { getByGuild, reload, toSchedule } from "../../plugins/spam";
import { adminEmbed } from "../embeds";

const MAX_MESSAGE_LENGTH = 2000;

const data = new SlashCommandBuilder()
    .setName("spam")
    .setDescription("Schedule recurring messages.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild);

data.addSubcommand((sub) =>
    sub
        .setName("date")
        .setDescription("Send a message every year on a specific date.")
        .addIntegerOption((o) =>
            o.setName("day").setDescription("Day of month").setRequired(true).setMinValue(1).setMaxValue(31),
        )
        .addIntegerOption((o) =>
            o.setName("month").setDescription("Month").setRequired(true).setMinValue(1).setMaxValue(12),
        )
        .addIntegerOption((o) =>
            o
                .setName("hour")
                .setDescription("Hour of the day (Europe/Vienna)")
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(23),
        )
        .addChannelOption((o) =>
            o
                .setName("channel")
                .setDescription("The channel to send the message to")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
        )
        .addStringOption((o) =>
            o
                .setName("message")
                .setDescription("The message to send")
                .setRequired(true)
                .setMaxLength(MAX_MESSAGE_LENGTH),
        ),
);

data.addSubcommand((sub) =>
    sub
        .setName("interval")
        .setDescription("Send a message repeatedly in a fixed interval.")
        .addIntegerOption((o) => o.setName("every").setDescription("Interval length").setRequired(true).setMinValue(1))
        .addStringOption((o) =>
            o
                .setName("unit")
                .setDescription("Interval unit")
                .setRequired(true)
                .addChoices({ name: "hours", value: "hours" }, { name: "days", value: "days" }),
        )
        .addChannelOption((o) =>
            o
                .setName("channel")
                .setDescription("The channel to send the message to")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
        )
        .addStringOption((o) =>
            o
                .setName("message")
                .setDescription("The message to send")
                .setRequired(true)
                .setMaxLength(MAX_MESSAGE_LENGTH),
        )
        .addIntegerOption((o) =>
            o
                .setName("start_hour")
                .setDescription("Hour of the first message (Europe/Vienna), defaults to the next full hour")
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(23),
        ),
);

data.addSubcommand((sub) => sub.setName("list").setDescription("List all scheduled messages of this server."));

data.addSubcommand((sub) =>
    sub
        .setName("remove")
        .setDescription("Remove a scheduled message.")
        .addStringOption((o) =>
            o.setName("id").setDescription("The ID of the spam").setRequired(true).setAutocomplete(true),
        ),
);

export const spam: CommandHandler = {
    data,
    executeInteraction: async (interaction: ChatInputCommandInteraction): Promise<void> => {
        if (!interaction.inCachedGuild()) {
            await interaction.reply({
                embeds: [adminEmbed().setDescription("This command can only be used in a server.")],
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // Command permissions can be changed per server, so make sure only admins can manage spams
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
            await interaction.reply({
                embeds: [adminEmbed().setDescription("Only administrators can manage spams.")],
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        switch (interaction.options.getSubcommand()) {
            case "date":
            case "interval":
                await create(interaction);
                return;
            case "list":
                await list(interaction);
                return;
            case "remove":
                await remove(interaction);
                return;
        }
    },
};

async function create(interaction: ChatInputCommandInteraction<"cached">) {
    const channel = interaction.options.getChannel("channel", true, [
        ChannelType.GuildText,
        ChannelType.GuildAnnouncement,
    ]);
    const message = interaction.options.getString("message", true);

    const me = interaction.guild.members.me;
    const permissions = me ? channel.permissionsFor(me) : null;
    if (!permissions?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) {
        await interaction.reply({
            embeds: [adminEmbed().setDescription(`I am not allowed to send messages in ${channel}.`)],
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const base = {
        guildId: interaction.guildId,
        channelId: channel.id,
        message,
        createdBy: interaction.user.id,
    };

    let doc: ISpam;

    if (interaction.options.getSubcommand() === "date") {
        const day = interaction.options.getInteger("day", true);
        const month = interaction.options.getInteger("month", true);
        const hour = interaction.options.getInteger("hour", true);

        if (!isValidDayOfMonth(day, month)) {
            await interaction.reply({
                embeds: [adminEmbed().setDescription(`${day}.${month}. is not a valid date.`)],
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        doc = { ...base, createdAt: new Date(), type: "date", day, month, hour };
    } else {
        const every = interaction.options.getInteger("every", true);
        const unit = interaction.options.getString("unit", true) as SpamUnit;
        const startHour = interaction.options.getInteger("start_hour");

        doc = {
            ...base,
            createdAt: new Date(),
            type: "interval",
            every,
            unit,
            startAt: getNextStart(new Date(), startHour),
        };
    }

    await interaction.deferReply();

    const created = await SpamDB.create(doc);
    await reload();

    const schedule = toSchedule(created);
    await interaction.editReply({
        embeds: [
            adminEmbed()
                .setTitle("Spam scheduled")
                .setDescription(`Sending to ${channel} ${schedule ? describeSchedule(schedule) : ""}.`)
                .addFields({ name: "ID", value: created.id }, { name: "Message", value: preview(message, 1000) }),
        ],
    });
}

async function list(interaction: ChatInputCommandInteraction<"cached">) {
    const spams = await SpamDB.find({ guildId: interaction.guildId }).sort({ createdAt: 1 }).exec();

    if (spams.length === 0) {
        await interaction.reply({
            embeds: [adminEmbed().setDescription("There are no scheduled spams on this server.")],
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const lines = spams.map((s) => {
        const schedule = toSchedule(s);
        return `\`${s.id}\` <#${s.channelId}> ${schedule ? describeSchedule(schedule) : "invalid schedule"}\n> ${preview(s.message, 80)}`;
    });

    // Embed descriptions are limited to 4096 characters
    let description = "";
    for (const line of lines) {
        if (description.length + line.length + 2 > 4000) {
            description += "\n…";
            break;
        }
        description += `${line}\n\n`;
    }

    await interaction.reply({
        embeds: [adminEmbed().setTitle("Scheduled spams").setDescription(description)],
        flags: MessageFlags.Ephemeral,
    });
}

async function remove(interaction: ChatInputCommandInteraction<"cached">) {
    const id = interaction.options.getString("id", true).trim();

    const deleted = mongoose.isObjectIdOrHexString(id)
        ? await SpamDB.findOneAndDelete({ _id: id, guildId: interaction.guildId }).exec()
        : null;

    if (!deleted) {
        await interaction.reply({
            embeds: [adminEmbed().setDescription(`No spam with ID \`${preview(id, 50)}\` found on this server.`)],
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    await reload();
    await interaction.reply({
        embeds: [adminEmbed().setDescription(`Spam \`${deleted.id}\` has been removed.`)],
    });
}

export async function autocomplete(interaction: AutocompleteInteraction) {
    if (!interaction.guildId || !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.respond([]);
        return;
    }

    const focused = interaction.options.getFocused().toLowerCase();
    const spams = getByGuild(interaction.guildId);

    const choices = spams
        .map((s) => ({ name: preview(`${s.id.slice(-6)}: ${s.message}`, 100), value: s.id as string }))
        .filter((c) => c.name.toLowerCase().includes(focused) || c.value.includes(focused))
        .slice(0, 25);

    await interaction.respond(choices);
}

function preview(text: string, length: number) {
    const chars = Array.from(text.replace(/\s+/g, " "));
    return chars.length > length ? `${chars.slice(0, length - 1).join("")}…` : chars.join("");
}
