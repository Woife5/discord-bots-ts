import { getPowerUpdate, getUser, User, updateUser } from "@helpers";
import { isBeforeYesterdayMidnight } from "@woife5/shared";
import type { Client } from "discord.js";

const FREEZE: "tarot-streak-freeze" = "tarot-streak-freeze";

/**
 * Consumes one tarot streak freeze for every user that missed their tarot yesterday,
 * still has an active streak and owns at least one freeze.
 * The last tarot date is moved to yesterday so the streak continues, the streak number itself is not increased.
 */
export async function applyStreakFreezes(client: Client) {
    const yesterdayMidnight = new Date();
    yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);
    yesterdayMidnight.setHours(0, 0, 0, 0);

    const candidates = await User.find({
        lastTarot: { $lt: yesterdayMidnight },
        tarotStreak: { $gt: 0 },
        [`powers.${FREEZE}`]: { $gt: 0 },
    }).exec();

    for (const candidate of candidates) {
        // Re-check with the (possibly more recent) cached user
        const user = await getUser(candidate.userId);
        if (
            !user ||
            !isBeforeYesterdayMidnight(user.lastTarot) ||
            user.tarotStreak <= 0 ||
            (user.powers?.[FREEZE] ?? 0) <= 0
        ) {
            continue;
        }

        const lastTarot = new Date(yesterdayMidnight);
        lastTarot.setHours(12, 0, 0, 0);

        const { powers } = await getPowerUpdate(user.userId, FREEZE, -1);
        await updateUser(user.userId, { powers, lastTarot });

        try {
            const member = await client.users.fetch(user.userId);
            await member.send(
                `Wow. You forgot your tarot yesterday. Pathetic. 😒\nLucky for you, I melted one of your streak freezes 🧊 to save your 🔥 ${user.tarotStreak} streak. You have ${powers[FREEZE]} left. Don't make me do this again, you lazy ass! 😡`,
            );
        } catch {
            // ignored -> user has disabled direct messages
        }
    }
}
