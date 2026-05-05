package commands

import (
	"github.com/bwmarrin/discordgo"
	"github.com/woife5/copilot-bot/llm"
)

// Bot holds shared dependencies that command handlers need.
type Bot struct {
	History  *llm.ChatHistory
	LLM      *llm.OpenRouterClient
	ClientID string
}

// CommandDefs returns all slash command definitions for registration.
func CommandDefs() []*discordgo.ApplicationCommand {
	adminPerm := int64(discordgo.PermissionAdministrator)

	return []*discordgo.ApplicationCommand{
		{
			Name:        "help",
			Description: "Get help with Microsoft Copilot.",
		},
		{
			Name:                     "history",
			Description:              "Edit the chat history.",
			DefaultMemberPermissions: &adminPerm,
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionString,
					Name:        "command",
					Description: "The command to execute on the chat history.",
					Required:    true,
					Choices: []*discordgo.ApplicationCommandOptionChoice{
						{Name: "clear", Value: "clear"},
						{Name: "length", Value: "length"},
					},
				},
			},
		},
		{
			Name:                     "systemmessage",
			Description:              "Edit the system message.",
			DefaultMemberPermissions: &adminPerm,
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionString,
					Name:        "message",
					Description: "The new system message.",
				},
			},
		},
	}
}

// HandleInteraction routes an interaction to the appropriate command handler.
func (b *Bot) HandleInteraction(s *discordgo.Session, i *discordgo.InteractionCreate) {
	if i.Type != discordgo.InteractionApplicationCommand {
		return
	}

	data := i.ApplicationCommandData()

	switch data.Name {
	case "help":
		b.handleHelp(s, i)
	case "history":
		b.handleHistory(s, i)
	case "systemmessage":
		b.handleSystemMessage(s, i)
	}
}
