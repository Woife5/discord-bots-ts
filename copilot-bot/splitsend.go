package main

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/bwmarrin/discordgo"
)

const maxMessageLength = 2000

// markdownPatterns lists patterns that come in pairs.
// An odd count means unclosed formatting that we shouldn't split inside.
var markdownPatterns = []*regexp.Regexp{
	regexp.MustCompile("```"),   // Code blocks
	regexp.MustCompile("``"),    // Double backtick
	regexp.MustCompile("`"),     // Inline code
	regexp.MustCompile(`\*\*`),  // Bold
	regexp.MustCompile("__"),    // Underline/bold
	regexp.MustCompile(`\|\|`),  // Spoilers
	regexp.MustCompile("~~"),    // Strikethrough
}

func hasUnclosedMarkdown(chunk string) bool {
	for _, pattern := range markdownPatterns {
		matches := pattern.FindAllString(chunk, -1)
		if len(matches)%2 != 0 {
			return true
		}
	}
	return false
}

func findSafeSplitPoint(text string, maxLen int) int {
	end := min(len(text), maxLen)

	// Try paragraph break (double newline)
	if idx := strings.LastIndex(text[:end], "\n\n"); idx > maxLen*3/10 {
		if !hasUnclosedMarkdown(text[:idx]) {
			return idx + 2
		}
	}

	// Try single newline
	if idx := strings.LastIndex(text[:end], "\n"); idx > maxLen/2 {
		if !hasUnclosedMarkdown(text[:idx]) {
			return idx + 1
		}
	}

	// Walk backwards looking for a safe whitespace break
	for i := end; i > maxLen*3/10; i-- {
		ch := text[i-1]
		if ch == ' ' || ch == '\n' {
			if !hasUnclosedMarkdown(text[:i]) {
				return i
			}
		}
	}

	// Fallback: split at last space
	if idx := strings.LastIndex(text[:end], " "); idx > maxLen*3/10 {
		return idx
	}

	// Last resort: hard cut
	return maxLen
}

func splitMessage(message string) []string {
	var chunks []string
	remaining := message

	for len(remaining) > 0 {
		if len(remaining) <= maxMessageLength {
			chunks = append(chunks, remaining)
			break
		}

		splitPoint := findSafeSplitPoint(remaining, maxMessageLength)
		chunk := strings.TrimSpace(remaining[:splitPoint])
		if chunk != "" {
			chunks = append(chunks, chunk)
		}
		remaining = strings.TrimSpace(remaining[splitPoint:])
	}

	return chunks
}

// SplitAndSend splits a long message into Discord-safe chunks and sends them.
// It returns the first error encountered — callers decide how to handle it.
func SplitAndSend(s *discordgo.Session, channelID, message string) error {
	if len(message) <= maxMessageLength {
		_, err := s.ChannelMessageSend(channelID, message)
		return err
	}

	for _, chunk := range splitMessage(message) {
		if _, err := s.ChannelMessageSend(channelID, chunk); err != nil {
			return fmt.Errorf("sending message chunk: %w", err)
		}
	}
	return nil
}
