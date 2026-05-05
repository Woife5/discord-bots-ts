package commands

import (
	"fmt"

	"github.com/bwmarrin/discordgo"
	"github.com/woife5/copilot-bot/config"
)

func (b *Bot) handleHistory(s *discordgo.Session, i *discordgo.InteractionCreate) {
	options := i.ApplicationCommandData().Options
	if len(options) == 0 {
		return
	}

	command := options[0].StringValue()

	switch command {
	case "length":
		embed := adminEmbed()
		embed.Description = fmt.Sprintf("Current chat history length: `%d`", b.History.Length())
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Embeds: []*discordgo.MessageEmbed{embed},
			},
		})

	case "clear":
		b.History.Clear()
		embed := adminEmbed()
		embed.Description = "Chat history has been cleared."
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Embeds: []*discordgo.MessageEmbed{embed},
			},
		})
	}
}

// adminEmbed returns a base embed for admin command responses.
func adminEmbed() *discordgo.MessageEmbed {
	return &discordgo.MessageEmbed{
		Color: 0x00FFFF, // Aqua
		Author: &discordgo.MessageEmbedAuthor{
			Name:    "Copilot",
			IconURL: config.CopilotIcon,
		},
	}
}
