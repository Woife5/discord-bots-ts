export const spamTimezone = "Europe/Vienna";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export type SpamUnit = "hours" | "days";

export type SpamSchedule =
    | { type: "date"; day: number; month: number; hour: number }
    | { type: "interval"; every: number; unit: SpamUnit; startAt: Date };

type LocalParts = { year: number; month: number; day: number; hour: number };

const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: spamTimezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hourCycle: "h23",
});

export function getLocalParts(date: Date): LocalParts {
    const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
    return {
        year: Number(parts.year),
        month: Number(parts.month),
        day: Number(parts.day),
        hour: Number(parts.hour),
    };
}

/**
 * Checks whether the given day exists in the given month (29.02. is considered valid).
 */
export function isValidDayOfMonth(day: number, month: number): boolean {
    if (month < 1 || month > 12 || day < 1) {
        return false;
    }
    // 2024 is a leap year, so 29.02. is accepted
    return new Date(Date.UTC(2024, month - 1, day)).getUTCDate() === day;
}

/**
 * Returns the next full hour after `now`, optionally the next one matching the given local hour.
 */
export function getNextStart(now: Date, startHour?: number | null): Date {
    const next = new Date(Math.floor(now.getTime() / HOUR_MS) * HOUR_MS + HOUR_MS);
    if (startHour === undefined || startHour === null) {
        return next;
    }

    // At most two days are needed, even with DST switches
    for (let i = 0; i < 48; i++) {
        if (getLocalParts(next).hour === startHour) {
            return next;
        }
        next.setTime(next.getTime() + HOUR_MS);
    }

    throw new Error(`Could not find a start time for hour ${startHour}`);
}

function localDayNumber(parts: LocalParts): number {
    return Math.round(Date.UTC(parts.year, parts.month - 1, parts.day) / DAY_MS);
}

/**
 * Rounds a date to the nearest full hour.
 */
export function toHourSlot(date: Date): Date {
    return new Date(Math.round(date.getTime() / HOUR_MS) * HOUR_MS);
}

/**
 * Checks whether `slot` is the first full hour of its local day that reaches the given local hour.
 * This makes sure every local hour fires exactly once per day, even on DST switches:
 * a repeated hour (autumn) only fires the first time, a skipped hour (spring) fires one hour later.
 */
function isLocalHourStart(local: LocalParts, slot: Date, hour: number): boolean {
    if (local.hour < hour) {
        return false;
    }

    const previous = getLocalParts(new Date(slot.getTime() - HOUR_MS));
    return localDayNumber(previous) !== localDayNumber(local) || previous.hour < hour;
}

/**
 * Checks whether a spam should be sent in the full hour closest to `now`.
 * Expected to be called once every full hour.
 */
export function isDue(schedule: SpamSchedule, now: Date): boolean {
    const slot = toHourSlot(now);
    const local = getLocalParts(slot);

    if (schedule.type === "date") {
        return (
            local.month === schedule.month && local.day === schedule.day && isLocalHourStart(local, slot, schedule.hour)
        );
    }

    const every = Math.max(1, Math.floor(schedule.every));

    if (schedule.unit === "hours") {
        const hoursSinceStart = Math.round((slot.getTime() - schedule.startAt.getTime()) / HOUR_MS);
        return hoursSinceStart >= 0 && hoursSinceStart % every === 0;
    }

    const start = getLocalParts(schedule.startAt);
    if (!isLocalHourStart(local, slot, start.hour)) {
        return false;
    }

    const daysSinceStart = localDayNumber(local) - localDayNumber(start);
    return daysSinceStart >= 0 && daysSinceStart % every === 0;
}

export function describeSchedule(schedule: SpamSchedule): string {
    const pad = (n: number) => n.toString().padStart(2, "0");

    if (schedule.type === "date") {
        const leapYear = schedule.day === 29 && schedule.month === 2 ? " (leap years only)" : "";
        return `every year on ${pad(schedule.day)}.${pad(schedule.month)}. at ${pad(schedule.hour)}:00${leapYear}`;
    }

    const start = getLocalParts(schedule.startAt);
    const unit = schedule.every === 1 ? schedule.unit.slice(0, -1) : `${schedule.every} ${schedule.unit}`;
    return `every ${unit}, starting ${pad(start.day)}.${pad(start.month)}.${start.year} ${pad(start.hour)}:00`;
}
