export function hasEmoji(text: string): boolean {
    return /\p{Extended_Pictographic}/u.test(text);
}

export function toCleanLowerCase(text?: string): string {
    return (text ?? "").toLowerCase().trim();
}
