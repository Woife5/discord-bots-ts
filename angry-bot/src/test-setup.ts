import { mock } from "bun:test";

mock.module("helpers/env.util", () => ({
    clientId: "client-id",
    token: "token",
    adminId: "admin-id",
    mongoUri: "mongo-uri",
}));
