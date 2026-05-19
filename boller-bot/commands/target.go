package commands

import (
	"context"
	"fmt"

	"github.com/bwmarrin/discordgo"
	"github.com/woife5/boller-bot/config"
	"github.com/woife5/boller-bot/database"
)

func (b *Bot) handleTarget(s *discordgo.Session, i *discordgo.InteractionCreate) {
	// Only the designated admin may use this command
	var userID string
	if i.Member != nil {
		userID = i.Member.User.ID
	} else if i.User != nil {
		userID = i.User.ID
	}

	if userID != b.WolfgangID {
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "You don't have permission to use this command.",
				Flags:   discordgo.MessageFlagsEphemeral,
			},
		})
		return
	}

	opts := i.ApplicationCommandData().Options
	embed := defaultEmbed()
	embed.Thumbnail = &discordgo.MessageEmbedThumbnail{URL: config.BollerwagenLogoURL}

	// No user option supplied → reset
	if len(opts) == 0 || opts[0].Value == nil {
		if err := b.Targets.Reset(context.Background()); err != nil {
			embed.Description = fmt.Sprintf("Failed to reset target: %v", err)
		} else {
			embed.Description = "Target cleared. The bot will join any occupied voice channel."
		}
	} else {
		user := opts[0].UserValue(s)
		target := database.Target{
			UserID:   user.ID,
			UserName: user.Username,
		}
		if err := b.Targets.Set(context.Background(), target); err != nil {
			embed.Description = fmt.Sprintf("Failed to set target: %v", err)
		} else {
			embed.Description = fmt.Sprintf("Target set to <@%s> (%s).", user.ID, user.Username)
		}
	}

	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: []*discordgo.MessageEmbed{embed},
		},
	})
}
