package main

import (
	"context"
	"fmt"
	"log"
	"regexp"
	"strings"
	"time"

	"github.com/bwmarrin/discordgo"
)

// mentionRegex matches Discord user mentions like <@123456> or <@!123456>.
var mentionRegex = regexp.MustCompile(`<@!?\d+>`)

// Bot holds all state needed by the Discord bot.
// In Go, we group related state in a struct and attach methods to it.
type Bot struct {
	session *discordgo.Session
	history *ChatHistory
	llm     *OpenRouterClient
	config  Config
}

// NewBot creates and configures a new Bot instance.
func NewBot(cfg Config) (*Bot, error) {
	// discordgo requires the "Bot " prefix before the token
	session, err := discordgo.New("Bot " + cfg.BotToken)
	if err != nil {
		// In Go, we wrap errors with context using fmt.Errorf and %w
		return nil, fmt.Errorf("creating Discord session: %w", err)
	}

	bot := &Bot{
		session: session,
		history: NewChatHistory(),
		llm:     NewOpenRouterClient(cfg.OpenRouterKey),
		config:  cfg,
	}

	// Set gateway intents — same ones as the TypeScript version
	session.Identify.Intents = discordgo.IntentsGuilds |
		discordgo.IntentsGuildMessages |
		discordgo.IntentsDirectMessages |
		discordgo.IntentsMessageContent

	// Register event handlers as methods on the Bot struct.
	// discordgo uses type-based dispatch: the handler's function
	// signature determines which events it receives.
	session.AddHandler(bot.onReady)
	session.AddHandler(bot.onInteractionCreate)
	session.AddHandler(bot.onMessageCreate)

	return bot, nil
}

// Start opens the websocket connection to Discord.
func (b *Bot) Start() error {
	if err := b.session.Open(); err != nil {
		return fmt.Errorf("opening connection: %w", err)
	}
	return nil
}

// Close cleanly shuts down the Discord session.
func (b *Bot) Close() {
	b.session.Close()
}

// onReady is called when the bot has connected and is ready.
func (b *Bot) onReady(s *discordgo.Session, r *discordgo.Ready) {
	fmt.Printf("Bot is logged in as %s\n", r.User.Username)
	b.registerCommands()
}

// onMessageCreate handles incoming messages — the core chat logic.
func (b *Bot) onMessageCreate(s *discordgo.Session, m *discordgo.MessageCreate) {
	// Ignore messages from bots (including ourselves)
	if m.Author.Bot {
		return
	}

	// Check if the bot was @mentioned
	mentioned := false
	for _, user := range m.Mentions {
		if user.ID == s.State.User.ID {
			mentioned = true
			break
		}
	}

	// Check if message is a DM
	channel, err := s.Channel(m.ChannelID)
	if err != nil {
		log.Printf("Error fetching channel %s: %v", m.ChannelID, err)
		return
	}
	isDM := channel.Type == discordgo.ChannelTypeDM

	// Only respond to @mentions and DMs
	if !mentioned && !isDM {
		return
	}

	// Show typing indicator immediately
	if err := s.ChannelTyping(m.ChannelID); err != nil {
		log.Printf("Error sending typing indicator: %v", err)
	}

	// Keep typing in a goroutine — this is Go's lightweight concurrency!
	// We use a channel to signal when to stop, and defer close() to
	// guarantee cleanup even if we return early or panic.
	done := make(chan struct{})
	defer close(done)

	go func() {
		ticker := time.NewTicker(9500 * time.Millisecond)
		defer ticker.Stop()
		for {
			select {
			case <-done:
				return
			case <-ticker.C:
				if err := s.ChannelTyping(m.ChannelID); err != nil {
					log.Printf("Error sending typing indicator: %v", err)
					return
				}
			}
		}
	}()

	// Clean the message: remove mentions and the bot's name
	cleaned := mentionRegex.ReplaceAllString(m.Content, "")
	cleaned = strings.TrimSpace(cleaned)
	cleaned = strings.ReplaceAll(cleaned, "@Copilot ", "")

	// Append user message, then get a snapshot for the LLM call.
	// These are separate operations now — clear intent, no side effects
	// hidden inside a "getter".
	b.history.Append("user", cleaned)
	messages := b.history.Snapshot()

	// Create a context with timeout for the LLM call.
	// context.Context is how Go propagates cancellation and deadlines
	// through call chains — any well-behaved I/O function accepts one.
	ctx, cancel := context.WithTimeout(context.Background(), 75*time.Second)
	defer cancel()

	reply, err := b.llm.GetChatCompletion(ctx, messages)
	if err != nil {
		log.Printf("LLM error: %v", err)
		if _, err := s.ChannelMessageSend(m.ChannelID, FallbackMessage); err != nil {
			log.Printf("Error sending fallback message: %v", err)
		}
		return
	}

	if reply != "" {
		b.history.Append("assistant", reply)
		if err := SplitAndSend(s, m.ChannelID, reply); err != nil {
			log.Printf("Error sending reply: %v", err)
		}
		return
	}

	// Fallback message if LLM returns empty
	if _, err := s.ChannelMessageSend(m.ChannelID, FallbackMessage); err != nil {
		log.Printf("Error sending fallback message: %v", err)
	}
}
