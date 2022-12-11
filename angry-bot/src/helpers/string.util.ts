export class StringUtils {
    static hasEmoji(text: string): boolean {
        return /\p{Extended_Pictographic}/u.test(text);
    }

    static toCleanLowerCase(text?: string): string {
        return (text ?? "").toLowerCase().trim();
    }
}
