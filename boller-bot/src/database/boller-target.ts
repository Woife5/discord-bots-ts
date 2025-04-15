import type { Snowflake } from "discord.js";
import { config } from "./client";

type Target = {
    guildId?: Snowflake;
    userId: Snowflake;
    userName?: string;
};

const TARGET_KEY = "target";
let currentTarget: Target | null = null;

/** @throws when removing the target fails */
export async function resetTarget() {
    await config.deleteOne({ key: TARGET_KEY });
    currentTarget = null;
}

/** @throws when adding or updating the key fails */
export async function setTarget(target: Target) {
    const result = await config.findOneAndUpdate(
        { key: TARGET_KEY },
        { $set: { value: target } },
        { upsert: true, returnDocument: "after" },
    );

    if (!result) {
        console.error("Nothing returned from database?");
        return;
    }

    currentTarget = result.value as Target;
}

export async function getTarget() {
    if (currentTarget) {
        return currentTarget;
    }

    try {
        const target = await config.findOne({ key: TARGET_KEY });
        if (!target) {
            return null;
        }

        currentTarget = target.value as Target;
        return currentTarget;
    } catch (err) {
        console.error("Failed to get target from database", err);
        return null;
    }
}
