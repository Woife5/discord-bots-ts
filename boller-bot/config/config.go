package config

import (
	"fmt"
	"os"
)

const (
	BollerwagenLogoURL = "https://www.ffn.de/fileadmin/content/images/radiobollerwagen/logo-bollerwagen.png"
	BollerwagenColor   = 0xF4A300 // orange
)

// Config holds the bot's runtime configuration loaded from environment variables.
type Config struct {
	BotToken    string
	ClientID    string
	WolfgangID  string
	MongoURI    string
}

// Load reads required environment variables and exits if any are missing.
func Load() Config {
	botToken := os.Getenv("BOT_TOKEN")
	clientID := os.Getenv("CLIENT_ID")
	wolfgangID := os.Getenv("WOLFGANG_ID")
	mongoURI := os.Getenv("MONGO_URI")

	if botToken == "" || clientID == "" || wolfgangID == "" || mongoURI == "" {
		fmt.Fprintln(os.Stderr, "Please provide all of the following environment variables: BOT_TOKEN, CLIENT_ID, WOLFGANG_ID, MONGO_URI")
		os.Exit(1)
	}

	return Config{
		BotToken:   botToken,
		ClientID:   clientID,
		WolfgangID: wolfgangID,
		MongoURI:   mongoURI,
	}
}
