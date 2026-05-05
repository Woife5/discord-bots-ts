package commands

import (
	"github.com/bwmarrin/discordgo"
	"github.com/woife5/copilot-bot/config"
)

func (b *Bot) handleHelp(s *discordgo.Session, i *discordgo.InteractionCreate) {
	embed := &discordgo.MessageEmbed{
		Color: 0xFFFFFF, // White
		Author: &discordgo.MessageEmbedAuthor{
			Name:    "Copilot",
			IconURL: config.CopilotIcon,
		},
		Title:       "Microsoft Copilot",
		Description: config.FallbackMessage,
	}

	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: []*discordgo.MessageEmbed{embed},
		},
	})
}
