package splitsend

import (
	"regexp"
	"strings"
)

const maxLength = 2000

// markdownPair represents a markdown delimiter pattern that comes in pairs.
type markdownPair struct {
	pattern *regexp.Regexp
	name    string
}

var markdownPairs = []markdownPair{
	{regexp.MustCompile("```"), "code block"},
	{regexp.MustCompile("``"), "inline code"},
	{regexp.MustCompile("`"), "inline code"},
	{regexp.MustCompile(`\*\*`), "bold"},
	{regexp.MustCompile(`__`), "underline bold"},
	{regexp.MustCompile(`\|\|`), "spoiler"},
	{regexp.MustCompile(`~~`), "strikethrough"},
	{regexp.MustCompile(`(?:^|[^*])\*(?:[^*]|$)`), "italic"},
	{regexp.MustCompile(`(?:^|[^_])_(?:[^_]|$)`), "italic"},
}

// countMatches counts occurrences of a pattern in a string.
func countMatches(text string, pattern *regexp.Regexp) int {
	return len(pattern.FindAllStringIndex(text, -1))
}

// hasUnclosedMarkdown checks if a chunk has unclosed markdown formatting.
func hasUnclosedMarkdown(chunk string) bool {
	for _, pair := range markdownPairs {
		count := countMatches(chunk, pair.pattern)
		if count%2 != 0 {
			return true
		}
	}
	return false
}

// findSafeSplitPoint finds the last safe split point that doesn't break markdown formatting.
func findSafeSplitPoint(text string, maxLen int) int {
	if maxLen > len(text) {
		maxLen = len(text)
	}

	// Try to split at a newline for cleaner breaks
	lastNewline := strings.LastIndex(text[:maxLen], "\n")
	if lastNewline > maxLen/2 {
		chunk := text[:lastNewline]
		if !hasUnclosedMarkdown(chunk) {
			return lastNewline + 1 // Include the newline in the first chunk
		}
	}

	// Try splitting at paragraph breaks (double newlines)
	lastParagraph := strings.LastIndex(text[:maxLen], "\n\n")
	if lastParagraph > maxLen*3/10 {
		chunk := text[:lastParagraph]
		if !hasUnclosedMarkdown(chunk) {
			return lastParagraph + 2
		}
	}

	// Try splitting at code block boundaries
	codeBlockRegex := regexp.MustCompile("(?s)```.*?```")
	textToSearch := text[:maxLen]
	matches := codeBlockRegex.FindAllStringIndex(textToSearch, -1)
	lastCodeBlockEnd := 0
	for _, match := range matches {
		endPos := match[1]
		if endPos <= maxLen {
			lastCodeBlockEnd = endPos
		}
	}
	if lastCodeBlockEnd > maxLen*3/10 {
		return lastCodeBlockEnd
	}

	// Work backwards from maxLen, preferring spaces/newlines with valid markdown closure
	for i := maxLen; i > maxLen*3/10; i-- {
		if i >= len(text) {
			continue
		}
		ch := text[i]
		if ch == '\n' || ch == ' ' {
			chunk := text[:i]
			if !hasUnclosedMarkdown(chunk) {
				if ch == '\n' {
					return i + 1
				}
				return i
			}
		}
	}

	// Fall back to splitting at a space
	lastSpace := strings.LastIndex(text[:maxLen], " ")
	if lastSpace > maxLen*3/10 {
		return lastSpace
	}

	// Last resort: hard split at maxLen
	return maxLen
}

// SplitMessage splits a message into chunks respecting markdown formatting boundaries
// and Discord's 2000-character limit.
func SplitMessage(message string) []string {
	var chunks []string
	remaining := message

	for len(remaining) > 0 {
		if len(remaining) <= maxLength {
			chunks = append(chunks, remaining)
			break
		}

		splitPoint := findSafeSplitPoint(remaining, maxLength)
		chunk := strings.TrimSpace(remaining[:splitPoint])

		if len(chunk) > 0 {
			chunks = append(chunks, chunk)
		}

		remaining = strings.TrimSpace(remaining[splitPoint:])
	}

	return chunks
}
