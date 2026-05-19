package commands

import (
	"context"
	"fmt"

	"github.com/bwmarrin/discordgo"
	"github.com/woife5/boller-bot/config"
)

func (b *Bot) handleCurrentTarget(s *discordgo.Session, i *discordgo.InteractionCreate) {
	target, err := b.Targets.Get(context.Background())

	embed := defaultEmbed()
	embed.Thumbnail = &discordgo.MessageEmbedThumbnail{URL: config.BollerwagenLogoURL}

	if err != nil {
		embed.Description = "Failed to fetch target from database."
	} else if target == nil {
		embed.Description = "No target is currently set. The bot will join any occupied voice channel."
	} else {
		embed.Description = fmt.Sprintf("Current target: <@%s> (%s)", target.UserID, target.UserName)
	}

	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: []*discordgo.MessageEmbed{embed},
		},
	})
}
