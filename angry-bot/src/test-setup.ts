import { mock } from "bun:test";

mock.module("@woife5/shared/lib/utils/env.util", () => ({
    clientId: "client-id",
    token: "token",
    adminId: "admin-id",
    mongoUri: "mongo-uri",
}));
