import { Role } from "commands/command-interfaces";
import { Message } from "discord.js";

export type PluginReturnCode = "CONTINUE" | "DELETED" | "ABORT";

export class MessageWrapper {
    isDeleted = false;

    constructor(private message: Message) {}

    async applyPlugin(plugin: (message: Message) => Promise<PluginReturnCode>) {
        if (this.isDeleted) {
            return;
        }

        const code = await plugin(this.message);

        switch (code) {
            case "ABORT":
            case "DELETED":
                this.isDeleted = true;
                break;
            default:
                break;
        }
    }
}
