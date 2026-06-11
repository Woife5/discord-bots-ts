package main

import (
	_ "embed" // Required for the //go:embed directive below
	"sync"
)

// go:embed is a compile-time directive that reads a file's contents into a variable.
// No file I/O at runtime — the file is baked into the binary!
//
//go:embed system_message.txt
var defaultSystemMessage string

// ChatMessage represents a single message in the conversation.
type ChatMessage struct {
	Role    string `json:"role"`    // "system", "user", or "assistant"
	Content string `json:"content"`
}

// ChatHistory manages the conversation history in a thread-safe way.
// Unlike JavaScript which is single-threaded, Go uses goroutines for
// concurrency, so we need a sync.Mutex to protect shared state.
type ChatHistory struct {
	mu       sync.Mutex
	messages []ChatMessage
}

// NewChatHistory creates a history pre-loaded with the system prompt.
func NewChatHistory() *ChatHistory {
	return &ChatHistory{
		messages: []ChatMessage{
			{Role: "system", Content: defaultSystemMessage},
		},
	}
}

// Append adds a message to the history.
func (h *ChatHistory) Append(role, content string) {
	h.mu.Lock()
	defer h.mu.Unlock() // defer runs when the function returns — like try/finally
	h.messages = append(h.messages, ChatMessage{Role: role, Content: content})
}

// Snapshot returns a copy of the current history.
// Returning a copy prevents callers from mutating our internal state —
// this is important because Go slices are reference types.
func (h *ChatHistory) Snapshot() []ChatMessage {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Trim history if too long — keep system message (index 0), drop next 10
	if len(h.messages) > 80 {
		trimmed := make([]ChatMessage, 0, len(h.messages)-10)
		trimmed = append(trimmed, h.messages[0])
		trimmed = append(trimmed, h.messages[11:]...)
		h.messages = trimmed
	}

	result := make([]ChatMessage, len(h.messages))
	copy(result, h.messages)
	return result
}

// GetSystemMessage returns the current system prompt.
func (h *ChatHistory) GetSystemMessage() string {
	h.mu.Lock()
	defer h.mu.Unlock()
	if len(h.messages) > 0 {
		return h.messages[0].Content
	}
	return ""
}

// SetSystemMessage replaces the system prompt.
func (h *ChatHistory) SetSystemMessage(msg string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if len(h.messages) > 0 {
		h.messages[0].Content = msg
	}
}

// Len returns the number of messages in the history.
func (h *ChatHistory) Len() int {
	h.mu.Lock()
	defer h.mu.Unlock()
	return len(h.messages)
}

// Clear removes all messages except the system prompt.
func (h *ChatHistory) Clear() {
	h.mu.Lock()
	defer h.mu.Unlock()
	if len(h.messages) > 0 {
		h.messages = []ChatMessage{h.messages[0]}
	} else {
		h.messages = []ChatMessage{{Role: "system", Content: defaultSystemMessage}}
	}
}
