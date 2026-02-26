export function isBeforeYesterdayMidnight(date: Date | string): boolean {
    if (typeof date === "string") {
        date = new Date(date);
    }

    const yesterdayMidnight = new Date();
    yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);
    yesterdayMidnight.setHours(0, 0, 0, 0);

    return date.getTime() < yesterdayMidnight.getTime();
}

export function isToday(date: Date | string): boolean {
    if (typeof date === "string") {
        date = new Date(date);
    }

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const tomorrowMidnight = new Date();
    tomorrowMidnight.setHours(23, 59, 59, 999);

    return date.getTime() > todayMidnight.getTime() && date.getTime() < tomorrowMidnight.getTime();
}

export function daysUntil(date: Date | string): number {
    if (typeof date === "string") {
        date = new Date(date);
    }

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    return Math.floor((date.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
}

