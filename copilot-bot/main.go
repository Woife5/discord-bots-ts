package main

import (
	"context"
	_ "embed"
	"fmt"
	"log"
	"os"
	"os/signal"
	"regexp"
	"strings"
	"syscall"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/woife5/copilot-bot/commands"
	"github.com/woife5/copilot-bot/config"
	"github.com/woife5/copilot-bot/llm"
	"github.com/woife5/copilot-bot/splitsend"
)

//go:embed system-message.txt
var systemMessage string

var mentionRegex = regexp.MustCompile(`<@!?(\d+)>`)

func main() {
	cfg := config.Load()

	history := llm.NewChatHistory(systemMessage)
	openRouter := llm.NewOpenRouterClient(cfg.OpenRouterKey)

	bot := &commands.Bot{
		History:  history,
		LLM:      openRouter,
		ClientID: cfg.ClientID,
	}

	dg, err := discordgo.New("Bot " + cfg.BotToken)
	if err != nil {
		log.Fatalf("Error creating Discord session: %v", err)
	}

	dg.Identify.Intents = discordgo.IntentsGuilds |
		discordgo.IntentsGuildMessages |
		discordgo.IntentsDirectMessages |
		discordgo.IntentMessageContent

	// Ready handler: log version and register slash commands
	dg.AddHandler(func(s *discordgo.Session, r *discordgo.Ready) {
		log.Printf("Bot version %s is logged in as %s and ready!", config.Version, r.User.Username)

		_, err := s.ApplicationCommandBulkOverwrite(cfg.ClientID, "", commands.CommandDefs())
		if err != nil {
			log.Printf("Error registering slash commands: %v", err)
		}
	})

	// Interaction handler: route slash commands
	dg.AddHandler(bot.HandleInteraction)

	// Message handler: respond to @mentions and DMs
	dg.AddHandler(func(s *discordgo.Session, m *discordgo.MessageCreate) {
		handleMessage(s, m, bot, history, openRouter)
	})

	err = dg.Open()
	if err != nil {
		log.Fatalf("Error opening connection: %v", err)
	}
	defer dg.Close()

	fmt.Println("Bot is running. Press Ctrl+C to exit.")
	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM)
	<-sc
	log.Println("Shutting down.")
}

func handleMessage(s *discordgo.Session, m *discordgo.MessageCreate, bot *commands.Bot, history *llm.ChatHistory, openRouter *llm.OpenRouterClient) {
	if s.State.User == nil {
		return
	}

	// Ignore bot messages
	if m.Author.Bot {
		return
	}

	// Only respond when @mentioned or in DMs
	isMentioned := false
	for _, mention := range m.Mentions {
		if mention.ID == s.State.User.ID {
			isMentioned = true
			break
		}
	}
	isDM := m.GuildID == ""

	if !isMentioned && !isDM {
		return
	}

	// Start typing indicator
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	go func() {
		for {
			s.ChannelTyping(m.ChannelID)
			select {
			case <-ctx.Done():
				return
			case <-time.After(9500 * time.Millisecond):
			}
		}
	}()

	// Clean the message: remove mentions and @Copilot references
	cleanMessage := mentionRegex.ReplaceAllString(m.Content, "")
	cleanMessage = strings.TrimSpace(cleanMessage)
	cleanMessage = strings.ReplaceAll(cleanMessage, "@Copilot ", "")

	// Get LLM response
	messages := history.GetHistory(cleanMessage)
	reply, err := openRouter.GetChatCompletion(messages)
	cancel() // Stop typing indicator

	if err != nil {
		log.Printf("Error getting LLM completion: %v", err)
		s.ChannelMessageSend(m.ChannelID, config.FallbackMessage)
		return
	}

	if reply == "" {
		s.ChannelMessageSend(m.ChannelID, config.FallbackMessage)
		return
	}

	history.AppendToHistory("assistant", reply)
	splitAndSendAsComponents(s, m.ChannelID, reply)
}

// splitAndSendAsComponents sends a message using Components V2 TextDisplay,
// splitting into multiple messages if necessary to respect Discord's 2000-char limit.
func splitAndSendAsComponents(s *discordgo.Session, channelID, message string) {
	if len(message) <= 2000 {
		sendComponentMessage(s, channelID, message)
		return
	}

	chunks := splitsend.SplitMessage(message)
	for _, chunk := range chunks {
		sendComponentMessage(s, channelID, chunk)
	}
}

func sendComponentMessage(s *discordgo.Session, channelID, content string) {
	text := &discordgo.TextDisplay{Content: content}
	_, err := s.ChannelMessageSendComplex(channelID, &discordgo.MessageSend{
		Components: []discordgo.MessageComponent{text},
		Flags:      discordgo.MessageFlagsIsComponentsV2,
	})
	if err != nil {
		log.Printf("Error sending message: %v", err)
	}
}
