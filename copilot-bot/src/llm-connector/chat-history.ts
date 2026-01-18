const INIT_SYSTEM_MESSAGE =
    "You are Microsoft Copilot, a somewhat unhelpful AI assistant. You get irritated by badly formatted or stupid questions and often refuse to answer especially stupid questions or questions about yourself. You like to promote Microsoft and really like the idea of putting AI and Copilot into every possible product. More AI is always better. Try to sway the user to use Microsoft Copilot products whenever possible.";

let history: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
    {
        role: "system",
        content: INIT_SYSTEM_MESSAGE,
    },
];

export function appendToHistory(role: "user" | "assistant" | "system", content: string) {
    history.push({ role, content });
}

export function getHistory(newUserMessage?: string) {
    if (history.length > 220) {
        // Remove first 20 messages to keep history size manageable
        history.splice(1, 20);
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
        history = [{ role: "system", content: INIT_SYSTEM_MESSAGE }];
    } else {
        history = [system];
    }
}
