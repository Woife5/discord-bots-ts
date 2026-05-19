package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/bwmarrin/discordgo"
	"github.com/woife5/boller-bot/commands"
	"github.com/woife5/boller-bot/config"
	"github.com/woife5/boller-bot/database"
)

func main() {
	cfg := config.Load()

	targets := database.NewTargetStore(cfg.MongoURI)
	player := NewPlayer()

	bot := &commands.Bot{
		ClientID:   cfg.ClientID,
		WolfgangID: cfg.WolfgangID,
		Targets:    targets,
	}

	dg, err := discordgo.New("Bot " + cfg.BotToken)
	if err != nil {
		log.Fatalf("Error creating Discord session: %v", err)
	}

	dg.Identify.Intents = discordgo.IntentsGuilds | discordgo.IntentsGuildVoiceStates

	dg.AddHandler(func(s *discordgo.Session, r *discordgo.Ready) {
		log.Printf("BollerBot is logged in as %s and ready to boller!", r.User.Username)

		if _, err := s.ApplicationCommandBulkOverwrite(cfg.ClientID, "", commands.CommandDefs(cfg.WolfgangID)); err != nil {
			log.Printf("Error registering slash commands: %v", err)
		}
	})

	dg.AddHandler(bot.HandleInteraction)

	dg.AddHandler(func(s *discordgo.Session, v *discordgo.VoiceStateUpdate) {
		// BeforeUpdate is nil when the state was not previously cached (e.g. on startup).
		// Synthesize an empty VoiceState so handlers never receive a nil oldState.
		oldState := v.BeforeUpdate
		if oldState == nil {
			oldState = &discordgo.VoiceState{GuildID: v.GuildID}
		}
		player.HandleVoiceStateUpdate(s, oldState, v.VoiceState, targets)
	})

	if err := dg.Open(); err != nil {
		log.Fatalf("Error opening Discord connection: %v", err)
	}
	defer dg.Close()

	fmt.Println("BollerBot is running. Press Ctrl+C to exit.")
	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM)
	<-sc
	log.Println("Shutting down.")
}
