export class DateUtils {
    static isBeforeYesterdayMidnight(date: Date | string): boolean {
        if (typeof date === 'string') {
            date = new Date(date);
        }

        const yesterdayMidnight = new Date();
        yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);
        yesterdayMidnight.setHours(0, 0, 0, 0);

        return date.getTime() < yesterdayMidnight.getTime();
    }

    static isToday(date: Date | string): boolean {
        if (typeof date === 'string') {
            date = new Date(date);
        }

        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);

        return date.getTime() > todayMidnight.getTime();
    }

    static daysUntil(date: Date | string): number {
        if (typeof date === 'string') {
            date = new Date(date);
        }

        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);

        return Math.floor((date.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
    }

    /**
     * @param hour The hour of the day
     * @returns A Date representing the next time the specified hour occures
     */
    static getNextTime(hour: number): Date {
        const now = new Date();
        const next = new Date();

        next.setHours(hour, 0, 0, 0);

        if (next.getTime() < now.getTime()) {
            next.setDate(next.getDate() + 1);
        }

        return next;
    }
}
