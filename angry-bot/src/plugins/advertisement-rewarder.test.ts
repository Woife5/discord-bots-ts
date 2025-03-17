import { beforeEach, describe, expect, it, jest, mock } from "bun:test";
import { apply } from "./advertisement-rewarder";
import type { Message } from "discord.js";

const updateMock = jest.fn();
const getActionCacheMock = jest.fn();
const updateActionCacheMock = jest.fn();

mock.module("helpers/user.util", () => ({
    getUserActionCache: getActionCacheMock,
    updateUserBalance: updateMock,
    updateUserActionCache: updateActionCacheMock,
}));

describe("advertisement-rewarder", () => {
    const sponsorMessage = {
        author: { id: "one-sponsor" },
        cleanContent: "This message contains the word Marlboro",
    } as Message;

    beforeEach(() => {
        updateMock.mockClear();
        updateActionCacheMock.mockClear();
        getActionCacheMock.mockReturnValue(undefined);
    });

    it("should return 'CONTINUE' if no sponsors are mentioned", async () => {
        const noSponsorMessage = { author: { id: "1234567890" }, cleanContent: "This is a normal message" } as Message;
        const result = await apply(noSponsorMessage);
        expect(result).toBe("CONTINUE");
    });

    it("should give the user 10 coins if a sponsor is mentioned", async () => {
        const result = await apply(sponsorMessage);
        expect(updateMock).toHaveBeenCalledWith({ userId: "one-sponsor", amount: 10, username: undefined });
        expect(result).toBe("CONTINUE");
    });

    it("should give the user 10 coins for each sponsor mentioned", async () => {
        const doubleSponsorMessage = {
            author: { id: "two-sponsors" },
            cleanContent: "This message contains the word Marlboro and Rheinmetall",
        } as Message;

        const result = await apply(doubleSponsorMessage);
        expect(updateMock).toHaveBeenCalledTimes(2);
        expect(result).toBe("CONTINUE");
    });

    it("should not give the user coins if they have already been rewarded", async () => {
        getActionCacheMock.mockReturnValue({ advertisement: true });
        await apply(sponsorMessage);
        const result = await apply(sponsorMessage);
        expect(updateMock).toHaveBeenCalledTimes(0);
        expect(result).toBe("CONTINUE");
    });

    it("should set the user action cache if the user is rewarded", async () => {
        const msg = { ...sponsorMessage, author: { id: "action-test" } } as Message;
        await apply(msg);
        expect(updateActionCacheMock).toHaveBeenCalledWith("action-test", { advertisement: true });
    });
});
