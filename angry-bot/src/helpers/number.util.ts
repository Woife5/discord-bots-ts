/**
 * @returns a random number between min and max where both numbers are included
 */
export function getRandomInt(min: number, max: number): number {
    const upper = Math.floor(max);
    const lower = Math.ceil(min);
    return Math.floor(Math.random() * (upper - lower + 1)) + lower;
}
