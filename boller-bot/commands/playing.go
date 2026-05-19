package commands

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/woife5/boller-bot/config"
)

const (
	ffnBaseURL      = "https://www.ffn.de/fileadmin/"
	playlistJSONURL = ffnBaseURL + "content/playlist-xml/radiobollerwagen.json"
)

type song struct {
	Start  int64  `json:"start"`
	Title  string `json:"title"`
	Artist string `json:"artist"`
	Cover  string `json:"cover"`
}

type queueResponse struct {
	CurrentTime int64  `json:"currentTime"`
	Songs       []song `json:"songs"`
}

func (b *Bot) handlePlaying(s *discordgo.Session, i *discordgo.InteractionCreate) {
	resp, err := http.Get(playlistJSONURL)
	if err != nil || resp.StatusCode != http.StatusOK {
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "Error fetching queue data.",
				Flags:   discordgo.MessageFlagsEphemeral,
			},
		})
		return
	}
	defer resp.Body.Close()

	var data queueResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "Error parsing queue data.",
				Flags:   discordgo.MessageFlagsEphemeral,
			},
		})
		return
	}

	embed := buildPlayingEmbed(data)
	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: []*discordgo.MessageEmbed{embed},
		},
	})
}

func buildPlayingEmbed(data queueResponse) *discordgo.MessageEmbed {
	embed := defaultEmbed()
	embed.Thumbnail = &discordgo.MessageEmbedThumbnail{URL: config.BollerwagenLogoURL}
	embed.Timestamp = time.Unix(data.CurrentTime, 0).UTC().Format(time.RFC3339)

	// Sort descending by start time (most recent first)
	sort.Slice(data.Songs, func(i, j int) bool {
		return data.Songs[i].Start > data.Songs[j].Start
	})

	// Find the current song (most recent that started at or before now)
	var current *song
	for idx := range data.Songs {
		if data.Songs[idx].Start <= data.CurrentTime {
			current = &data.Songs[idx]
			break
		}
	}

	if current == nil {
		embed.Description = "No song is currently playing."
		return embed
	}

	embed.Thumbnail = &discordgo.MessageEmbedThumbnail{URL: ffnBaseURL + current.Cover}

	fields := []*discordgo.MessageEmbedField{
		{
			Name:   current.Title,
			Value:  fmt.Sprintf("by %s is currently playing.", current.Artist),
			Inline: false,
		},
	}

	// The first song in the sorted list is the next one (highest start time in the future)
	if data.Songs[0].Start > data.CurrentTime {
		next := data.Songs[0]
		nextTime := time.Unix(next.Start, 0).In(time.FixedZone("Europe/Vienna", 2*60*60))
		fields = append(fields, &discordgo.MessageEmbedField{
			Name:   "Next up",
			Value:  fmt.Sprintf("%s by %s at %s", next.Title, next.Artist, nextTime.Format("15:04")),
			Inline: false,
		})
	}

	embed.Fields = fields
	return embed
}
