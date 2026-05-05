package commands

import (
	"github.com/bwmarrin/discordgo"
)

func (b *Bot) handleSystemMessage(s *discordgo.Session, i *discordgo.InteractionCreate) {
	options := i.ApplicationCommandData().Options

	divider := true
	spacingLarge := discordgo.SeparatorSpacingSizeLarge
	separator := discordgo.Separator{
		Divider: &divider,
		Spacing: &spacingLarge,
	}

	// If no new message provided, show the current system message
	var newMessage string
	for _, opt := range options {
		if opt.Name == "message" {
			newMessage = opt.StringValue()
		}
	}

	if newMessage == "" {
		header := discordgo.TextDisplay{Content: "Current system message:"}
		text := discordgo.TextDisplay{Content: b.History.GetSystemMessage()}

		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Components: []discordgo.MessageComponent{&header, &separator, &text},
				Flags:      discordgo.MessageFlagsIsComponentsV2,
			},
		})
		return
	}

	b.History.SetSystemMessage(newMessage)
	header := discordgo.TextDisplay{Content: "System message updated to:"}
	text := discordgo.TextDisplay{Content: newMessage}

	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Components: []discordgo.MessageComponent{&header, &separator, &text},
			Flags:      discordgo.MessageFlagsIsComponentsV2,
		},
	})
}
