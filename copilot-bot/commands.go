package main

import (
	"fmt"
	"log"

	"github.com/bwmarrin/discordgo"
)

// In Go, we can't take the address of a constant directly,
// so we use a package-level variable for the permission pointer.
var adminPermission int64 = discordgo.PermissionAdministrator

// slashCommands defines all slash commands the bot supports.
// This is equivalent to the SlashCommandBuilder definitions in discord.js.
var slashCommands = []*discordgo.ApplicationCommand{
	{
		Name:        "help",
		Description: "Get help with Microsoft Copilot.",
	},
	{
		Name:                     "history",
		Description:              "Edit the chat history.",
		DefaultMemberPermissions: &adminPermission,
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
		DefaultMemberPermissions: &adminPermission,
		Options: []*discordgo.ApplicationCommandOption{
			{
				Type:        discordgo.ApplicationCommandOptionString,
				Name:        "message",
				Description: "The new system message.",
				Required:    false,
			},
		},
	},
}

// registerCommands bulk-registers all slash commands with Discord.
// This is equivalent to the REST PUT in the TypeScript version.
func (b *Bot) registerCommands() {
	_, err := b.session.ApplicationCommandBulkOverwrite(b.config.ClientID, "", slashCommands)
	if err != nil {
		log.Printf("Error registering commands: %v", err)
		return
	}
	fmt.Printf("Registered %d slash commands.\n", len(slashCommands))
}

// onInteractionCreate dispatches slash command interactions to their handlers.
// In Go, we use a switch statement instead of a Map/Collection lookup.
func (b *Bot) onInteractionCreate(s *discordgo.Session, i *discordgo.InteractionCreate) {
	if i.Type != discordgo.InteractionApplicationCommand {
		return
	}

	switch i.ApplicationCommandData().Name {
	case "help":
		b.handleHelp(s, i)
	case "history":
		b.handleHistory(s, i)
	case "systemmessage":
		b.handleSystemMessage(s, i)
	default:
		log.Printf("Unknown command: %s", i.ApplicationCommandData().Name)
	}
}

func (b *Bot) handleHelp(s *discordgo.Session, i *discordgo.InteractionCreate) {
	embed := &discordgo.MessageEmbed{
		Color: 0xFFFFFF, // White
		Author: &discordgo.MessageEmbedAuthor{
			Name:    "Copilot",
			IconURL: CopilotIcon,
		},
		Title:       "Microsoft Copilot",
		Description: FallbackMessage,
	}

	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: []*discordgo.MessageEmbed{embed},
		},
	})
}

func (b *Bot) handleHistory(s *discordgo.Session, i *discordgo.InteractionCreate) {
	options := i.ApplicationCommandData().Options
	if len(options) == 0 {
		return
	}

	command := options[0].StringValue()

	embed := &discordgo.MessageEmbed{
		Color: 0x00FFFF, // Aqua
		Author: &discordgo.MessageEmbedAuthor{
			Name:    "Copilot",
			IconURL: CopilotIcon,
		},
		Title: "Microsoft Copilot",
	}

	switch command {
	case "length":
		embed.Description = fmt.Sprintf("Current chat history length: `%d`", b.history.Len())
	case "clear":
		b.history.Clear()
		embed.Description = "Chat history has been cleared."
	}

	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: []*discordgo.MessageEmbed{embed},
		},
	})
}

func (b *Bot) handleSystemMessage(s *discordgo.Session, i *discordgo.InteractionCreate) {
	options := i.ApplicationCommandData().Options

	// No argument provided → show current system message
	if len(options) == 0 {
		current := b.history.GetSystemMessage()
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: fmt.Sprintf("**Current system message:**\n\n%s", current),
			},
		})
		return
	}

	// Update system message
	newMessage := options[0].StringValue()
	b.history.SetSystemMessage(newMessage)

	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Content: fmt.Sprintf("**System message updated to:**\n\n%s", newMessage),
		},
	})
}
