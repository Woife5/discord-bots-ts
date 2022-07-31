import { Role } from "commands/command-interfaces";
import { Message } from "discord.js";

export type PluginReturnCode = "CONTINUE" | "DELETED" | "ABORT";

export class MessageWrapper {
    isDeleted = false;
    isAborted = false;

    role: Role;

    constructor(private message: Message) {
        this.role = Role.OWNER;
    }

    async applyPlugin(plugin: (message: Message) => Promise<PluginReturnCode>) {
        if (this.isDeleted || this.isAborted) {
            return;
        }

        const code = await plugin(this.message);

        switch (code) {
            case "ABORT":
                this.isAborted = true;
                break;
            case "DELETED":
                this.isDeleted = true;
                break;
            default:
                break;
        }
    }
}
