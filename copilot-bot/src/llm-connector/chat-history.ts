import message from "../system-message.txt";

let history: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
    {
        role: "system",
        content: message,
    },
];

export function appendToHistory(role: "user" | "assistant" | "system", content: string) {
    history.push({ role, content });
}

export function getHistory(newUserMessage?: string) {
    if (history.length > 80) {
        // Remove first 10 messages to keep history size manageable
        history.splice(1, 10);
    }
    if (newUserMessage) {
        history.push({ role: "user", content: newUserMessage });
    }

    return history;
}

export function getSystemMessage() {
    return history[0].content;
}

export function setSystemMessage(newMessage: string) {
    history[0].content = newMessage;
}

export function clearHistory() {
    const system = history.shift();
    if (!system) {
        console.error("No message present in the history so far? wtf?");
        history = [{ role: "system", content: message }];
    } else {
        history = [system];
    }
}
