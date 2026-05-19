import Foundation

/// Thread-safe in-memory conversation history.
actor ChatHistory {
    private var messages: [ChatMessage]

    init(systemMessage: String) {
        messages = [ChatMessage(role: "system", content: systemMessage)]
    }

    /// Returns a snapshot of the history with the new user message appended (not persisted).
    func snapshot(appendingUserMessage userMessage: String) -> [ChatMessage] {
        var copy = messages
        if !userMessage.isEmpty {
            copy.append(ChatMessage(role: "user", content: userMessage))
        }
        return copy
    }

    /// Persists a message. Prunes the 10 oldest non-system messages if total exceeds 80.
    func append(role: String, content: String) {
        messages.append(ChatMessage(role: role, content: content))
        if messages.count > 80 {
            // Remove indices 1..<11 (oldest non-system messages)
            messages.removeSubrange(1..<11)
        }
    }

    func getSystemMessage() -> String {
        messages[0].content
    }

    func setSystemMessage(_ msg: String) {
        messages[0] = ChatMessage(role: "system", content: msg)
    }

    func length() -> Int {
        messages.count
    }

    func clear() {
        let system = messages[0]
        messages = [system]
    }
}
