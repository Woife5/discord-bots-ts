package commands

import (
	"github.com/bwmarrin/discordgo"
	"github.com/woife5/boller-bot/config"
)

func (b *Bot) handleHelp(s *discordgo.Session, i *discordgo.InteractionCreate) {
	embed := defaultEmbed()
	embed.Title = "Happy Birthday Felx :D"
	embed.Thumbnail = &discordgo.MessageEmbedThumbnail{URL: config.BollerwagenLogoURL}
	embed.Fields = []*discordgo.MessageEmbedField{
		{Name: "/playing", Value: "Show the currently playing song.", Inline: false},
		{Name: "/currenttarget", Value: "Show the current stalker-mode target.", Inline: false},
		{Name: "/target [user]", Value: "Set or clear the stalker-mode target (admin only).", Inline: false},
	}

	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: []*discordgo.MessageEmbed{embed},
		},
	})
}
