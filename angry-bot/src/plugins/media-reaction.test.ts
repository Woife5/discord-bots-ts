import { beforeEach, describe, expect, it, jest } from "bun:test";
import type { Message } from "discord.js";
import { react } from "./media-reaction";

const reactMock = jest.fn().mockResolvedValue({});
const replyMock = jest.fn().mockResolvedValue({ react: reactMock });

describe("media-reaction", () => {
    const testMessage = {
        reply: replyMock,
        cleanContent: "This is a test message.",
    } as unknown as Message;

    const mediaMessage = { ...testMessage, cleanContent: "This message contains the word medien" } as Message;
    const theorieMessage = { ...testMessage, cleanContent: "This message contains the word theorie" } as Message;

    beforeEach(() => {
        reactMock.mockClear();
        replyMock.mockClear();
    });

    it("should return 'CONTINUE' if no keywords are found", async () => {
        const result = await react(testMessage);
        expect(result).toBe("CONTINUE");
    });

    it("should return 'ABORT' when the message contains 'medien'", async () => {
        const result = await react(mediaMessage);
        expect(result).toBe("ABORT");
    });

    it("should return 'ABORT' when the message contains 'theorie'", async () => {
        const result = await react(theorieMessage);
        expect(result).toBe("ABORT");
    });

    it("should reply with 'Medientheorie!' if the message contains a keyword", async () => {
        const _result = await react(mediaMessage);
        expect(replyMock).toHaveBeenCalledWith("Medientheorie!");
    });

    it("should react with '❤️' if the message contains a keyword", async () => {
        await react(mediaMessage);
        expect(reactMock).toHaveBeenCalledWith("❤️");
    });

    it("should react with '♥' if the message contains a keyword", async () => {
        await react(mediaMessage);
        expect(reactMock).toHaveBeenCalledWith("♥");
    });

    it("should reply once when a keyword is found", async () => {
        await react(theorieMessage);
        expect(replyMock).toHaveBeenCalledTimes(1);
    });

    it("should react twice when a keyword is found", async () => {
        await react(theorieMessage);
        expect(reactMock).toHaveBeenCalledTimes(2);
    });
});
