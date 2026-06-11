package main

import (
	"fmt"
	"os"
	"strings"
)

// Constants — in Go, we use const blocks for compile-time constants.
// Unlike TypeScript, Go constants must be primitive types (string, int, etc.).
const (
	CopilotIcon        = "https://registry.npmmirror.com/@lobehub/icons-static-png/1.29.0/files/dark/copilot-color.png"
	CopilotWebLink     = "https://copilot.microsoft.com"
	CopilotAndroidLink = "https://play.google.com/store/apps/details?id=com.microsoft.copilot"
	CopilotIOSLink     = "https://apps.apple.com/at/app/microsoft-copilot/id6472538445"

	FallbackMessage = "Hello, if you want to continue using Microsoft Copilot, " +
		"please visit [copilot.microsoft.com](<https://copilot.microsoft.com/>) " +
		"or download the mobile app today for " +
		"[Android](<https://play.google.com/store/apps/details?id=com.microsoft.copilot/>) " +
		"or [iOS](<https://apps.apple.com/at/app/microsoft-copilot/id6472538445/>) devices."
)

// Config holds environment variables needed by the bot.
type Config struct {
	ClientID      string
	BotToken      string
	OpenRouterKey string
}

// LoadConfig reads required environment variables.
// It returns an error instead of calling os.Exit — only main() should decide to exit.
// This makes the function testable and reusable.
func LoadConfig() (Config, error) {
	clientID := os.Getenv("CLIENT_ID")
	botToken := os.Getenv("BOT_TOKEN")
	openRouterKey := os.Getenv("OPENROUTER_KEY")

	var missing []string
	if clientID == "" {
		missing = append(missing, "CLIENT_ID")
	}
	if botToken == "" {
		missing = append(missing, "BOT_TOKEN")
	}
	if openRouterKey == "" {
		missing = append(missing, "OPENROUTER_KEY")
	}
	if len(missing) > 0 {
		return Config{}, fmt.Errorf("missing required environment variables: %s", strings.Join(missing, ", "))
	}

	return Config{
		ClientID:      clientID,
		BotToken:      botToken,
		OpenRouterKey: openRouterKey,
	}, nil
}
