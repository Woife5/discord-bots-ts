package llm

import (
	"sync"
)

// Message represents a single chat message in the OpenAI-compatible format.
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatHistory manages an in-memory conversation history with thread-safe access.
type ChatHistory struct {
	mu                   sync.Mutex
	messages             []Message
	defaultSystemMessage string
}

// NewChatHistory creates a new ChatHistory seeded with the given system prompt.
func NewChatHistory(systemMessage string) *ChatHistory {
	return &ChatHistory{
		defaultSystemMessage: systemMessage,
		messages: []Message{
			{Role: "system", Content: systemMessage},
		},
	}
}

// GetHistory returns a snapshot of the current history with an optional new user
// message appended to the snapshot. The user message is NOT persisted to the
// internal history — call AppendToHistory explicitly once you have confirmed the
// LLM response succeeded, to avoid leaving the history in an inconsistent state.
func (h *ChatHistory) GetHistory(newUserMessage string) []Message {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Return a copy to avoid races with callers
	result := make([]Message, len(h.messages))
	copy(result, h.messages)

	// Append user message to the snapshot only (not to internal history)
	if newUserMessage != "" {
		result = append(result, Message{Role: "user", Content: newUserMessage})
	}

	return result
}

// AppendToHistory adds a message to the history.
// If the history exceeds 80 messages, the 10 oldest non-system messages are pruned.
func (h *ChatHistory) AppendToHistory(role, content string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.messages = append(h.messages, Message{Role: role, Content: content})

	if len(h.messages) > 80 {
		// Remove 10 oldest messages after the system message (index 0)
		h.messages = append(h.messages[:1], h.messages[11:]...)
	}
}

// GetSystemMessage returns the current system prompt.
func (h *ChatHistory) GetSystemMessage() string {
	h.mu.Lock()
	defer h.mu.Unlock()
	return h.messages[0].Content
}

// SetSystemMessage replaces the system prompt at runtime.
func (h *ChatHistory) SetSystemMessage(msg string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.messages[0].Content = msg
}

// Length returns the number of messages in the history.
func (h *ChatHistory) Length() int {
	h.mu.Lock()
	defer h.mu.Unlock()
	return len(h.messages)
}

// Clear removes all messages except the system prompt.
func (h *ChatHistory) Clear() {
	h.mu.Lock()
	defer h.mu.Unlock()
	system := h.messages[0]
	h.messages = []Message{system}
}
