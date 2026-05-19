package commands

import (
	"github.com/bwmarrin/discordgo"
	"github.com/woife5/boller-bot/config"
)

// defaultEmbed returns an embed pre-styled with the Bollerwagen branding.
func defaultEmbed() *discordgo.MessageEmbed {
	return &discordgo.MessageEmbed{
		Color: config.BollerwagenColor,
		Footer: &discordgo.MessageEmbedFooter{
			Text:    "Radio Bollerwagen",
			IconURL: config.BollerwagenLogoURL,
		},
	}
}
