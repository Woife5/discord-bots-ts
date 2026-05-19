package commands

import (
	"github.com/bwmarrin/discordgo"
	"github.com/woife5/boller-bot/database"
)

// Bot holds shared dependencies for command handlers.
type Bot struct {
	ClientID   string
	WolfgangID string
	Targets    *database.TargetStore
}

// CommandDefs returns all slash command definitions for registration.
func CommandDefs(wolfgangID string) []*discordgo.ApplicationCommand {
	adminPerm := int64(discordgo.PermissionAdministrator)
	_ = adminPerm // used below

	return []*discordgo.ApplicationCommand{
		{
			Name:        "help",
			Description: "Show information about the bot.",
		},
		{
			Name:        "playing",
			Description: "Get the currently playing song on Radio Bollerwagen.",
		},
		{
			Name:        "currenttarget",
			Description: "Show the currently set target user.",
		},
		{
			Name:                     "target",
			Description:              "Set or clear the stalker-mode target user.",
			DefaultMemberPermissions: &adminPerm,
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionUser,
					Name:        "user",
					Description: "The user to target. Leave empty to clear the target.",
					Required:    false,
				},
			},
		},
	}
}

// HandleInteraction routes an incoming interaction to the right handler.
func (b *Bot) HandleInteraction(s *discordgo.Session, i *discordgo.InteractionCreate) {
	if i.Type != discordgo.InteractionApplicationCommand {
		return
	}

	switch i.ApplicationCommandData().Name {
	case "help":
		b.handleHelp(s, i)
	case "playing":
		b.handlePlaying(s, i)
	case "currenttarget":
		b.handleCurrentTarget(s, i)
	case "target":
		b.handleTarget(s, i)
	}
}
