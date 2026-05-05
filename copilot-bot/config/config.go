package config

import (
	"fmt"
	"os"
)

const (
	CopilotIcon       = "https://registry.npmmirror.com/@lobehub/icons-static-png/1.29.0/files/dark/copilot-color.png"
	CopilotWebLink    = "https://copilot.microsoft.com"
	CopilotAndroidLink = "https://play.google.com/store/apps/details?id=com.microsoft.copilot"
	CopilotIOSLink    = "https://apps.apple.com/at/app/microsoft-copilot/id6472538445"
	Version           = "2.0.0"
)

var FallbackMessage = fmt.Sprintf(
	"Hello, if you want to continue using Microsoft Copilot, please visit [copilot.microsoft.com](<%s/>) or download the mobile app today for [Android](<%s/>) or [iOS](<%s/>) devices.",
	CopilotWebLink, CopilotAndroidLink, CopilotIOSLink,
)

// Config holds the bot's runtime configuration loaded from environment variables.
type Config struct {
	ClientID       string
	BotToken       string
	OpenRouterKey  string
}

// Load reads required environment variables and exits if any are missing.
func Load() Config {
	clientID := os.Getenv("CLIENT_ID")
	botToken := os.Getenv("BOT_TOKEN")
	openRouterKey := os.Getenv("OPENROUTER_KEY")

	if clientID == "" || botToken == "" || openRouterKey == "" {
		fmt.Fprintln(os.Stderr, "Please provide all of the following environment variables: CLIENT_ID, BOT_TOKEN, OPENROUTER_KEY")
		os.Exit(1)
	}

	return Config{
		ClientID:      clientID,
		BotToken:      botToken,
		OpenRouterKey: openRouterKey,
	}
}
