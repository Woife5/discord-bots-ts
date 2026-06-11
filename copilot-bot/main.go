package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	cfg, err := LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	bot, err := NewBot(cfg)
	if err != nil {
		log.Fatalf("Failed to create bot: %v", err)
	}
	defer bot.Close()

	if err := bot.Start(); err != nil {
		log.Fatalf("Failed to start bot: %v", err)
	}

	// Block until we receive a termination signal.
	// This is the idiomatic Go way to keep a program running —
	// we create a channel, register OS signals on it, and block on receive.
	fmt.Println("Bot is running. Press CTRL+C to exit.")
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	fmt.Println("Shutting down...")
}
