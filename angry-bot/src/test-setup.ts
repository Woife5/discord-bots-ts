import { mock } from "bun:test";

mock.module("@env", () => ({
    clientId: "client-id",
    token: "token",
    adminId: "admin-id",
    mongoUri: "mongo-uri",
}));
