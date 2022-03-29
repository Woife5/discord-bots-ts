export class NumberUtils {
    static getRandomInt(min: number, max: number): number {
        const upper = Math.floor(max);
        const lower = Math.ceil(min);
        return Math.floor(Math.random() * (upper - lower + 1)) + lower;
    }
}
