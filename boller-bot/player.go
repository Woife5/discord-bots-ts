package main

import (
	"context"
	"encoding/binary"
	"io"
	"log"
	"os/exec"
	"sync"

	"github.com/bwmarrin/discordgo"
	"github.com/woife5/boller-bot/database"
	"layeh.com/gopus"
)

const (
	radioURL    = "https://ffn-stream21.radiohost.de/radiobollerwagen_mp3-192"
	sampleRate  = 48000
	channels    = 2
	frameSize   = 960  // 20ms at 48kHz
	maxBytes    = 3840 // max Opus packet size
)

// Player manages voice connections and the shared audio stream.
type Player struct {
	mu          sync.Mutex
	connections map[string]*discordgo.VoiceConnection // keyed by guildID
	stopStream  chan struct{}
	streaming   bool
}

func NewPlayer() *Player {
	return &Player{
		connections: make(map[string]*discordgo.VoiceConnection),
	}
}

// HandleVoiceStateUpdate processes a voice state change event.
func (p *Player) HandleVoiceStateUpdate(s *discordgo.Session, oldState, newState *discordgo.VoiceState, targets *database.TargetStore) {
	// Ignore bots
	if newState.Member != nil && newState.Member.User.Bot {
		return
	}
	// Ignore non-channel events (e.g. mute/deafen)
	if oldState.ChannelID == newState.ChannelID {
		return
	}

	target, err := targets.Get(context.Background())
	if err != nil {
		log.Printf("Error fetching target: %v", err)
	}

	userID := newState.UserID

	// User joined a channel (was not in one before)
	if oldState.ChannelID == "" && newState.ChannelID != "" {
		p.mu.Lock()
		_, alreadyConnected := p.connections[newState.GuildID]
		p.mu.Unlock()

		if target != nil {
			if userID == target.UserID {
				// Always follow the target
				p.join(s, newState.GuildID, newState.ChannelID)
				return
			}
			if !alreadyConnected {
				p.join(s, newState.GuildID, newState.ChannelID)
			}
		} else if !alreadyConnected {
			p.join(s, newState.GuildID, newState.ChannelID)
		}
		return
	}

	// User switched channels
	if oldState.ChannelID != "" && newState.ChannelID != "" {
		if target != nil {
			if userID == target.UserID {
				// Always follow the target
				p.join(s, newState.GuildID, newState.ChannelID)
				return
			}
			p.mu.Lock()
			_, alreadyConnected := p.connections[newState.GuildID]
			p.mu.Unlock()
			if !alreadyConnected {
				p.join(s, newState.GuildID, newState.ChannelID)
				return
			}
		}

		// No target: follow if old channel is now empty (only bot was left)
		if p.channelHasOnlyBot(s, newState.GuildID, oldState.ChannelID) {
			p.join(s, newState.GuildID, newState.ChannelID)
		}
		return
	}

	// User left a channel
	if oldState.ChannelID != "" && newState.ChannelID == "" {
		if p.channelHasOnlyBot(s, newState.GuildID, oldState.ChannelID) {
			p.leave(newState.GuildID)
		}
	}
}

// channelHasOnlyBot returns true if the only member in a voice channel is the bot itself.
func (p *Player) channelHasOnlyBot(s *discordgo.Session, guildID, channelID string) bool {
	guild, err := s.State.Guild(guildID)
	if err != nil {
		return false
	}
	count := 0
	for _, vs := range guild.VoiceStates {
		if vs.ChannelID == channelID {
			count++
		}
	}
	// If count is 1, only the bot remains (the human just left)
	return count <= 1
}

// join connects to a voice channel and starts the audio stream if not already running.
func (p *Player) join(s *discordgo.Session, guildID, channelID string) {
	vc, err := s.ChannelVoiceJoin(guildID, channelID, false, true)
	if err != nil {
		log.Printf("Failed to join voice channel %s in guild %s: %v", channelID, guildID, err)
		return
	}

	p.mu.Lock()
	p.connections[guildID] = vc
	needsStart := !p.streaming
	if needsStart {
		p.stopStream = make(chan struct{})
		p.streaming = true
	}
	p.mu.Unlock()

	if needsStart {
		go p.streamRadio()
	}
}

// leave disconnects from the voice channel in a guild and stops the stream if no connections remain.
func (p *Player) leave(guildID string) {
	p.mu.Lock()
	vc, ok := p.connections[guildID]
	if ok {
		delete(p.connections, guildID)
	}
	remaining := len(p.connections)
	var stop chan struct{}
	if remaining == 0 && p.streaming {
		stop = p.stopStream
		p.streaming = false
	}
	p.mu.Unlock()

	if vc != nil {
		vc.Disconnect()
	}
	if stop != nil {
		close(stop)
	}
}

// streamRadio spawns FFmpeg and pipes PCM → Opus → all active voice connections.
func (p *Player) streamRadio() {
	p.mu.Lock()
	stop := p.stopStream
	p.mu.Unlock()

	encoder, err := gopus.NewEncoder(sampleRate, channels, gopus.Audio)
	if err != nil {
		log.Printf("Failed to create Opus encoder: %v", err)
		return
	}

	for {
		select {
		case <-stop:
			log.Println("Stream stopped.")
			return
		default:
		}

		if err := p.runFFmpeg(encoder, stop); err != nil && err != io.EOF {
			log.Printf("FFmpeg stream ended with error: %v — restarting", err)
		}

		// Check if we were told to stop during the ffmpeg run
		select {
		case <-stop:
			log.Println("Stream stopped.")
			return
		default:
		}
	}
}

// runFFmpeg starts an FFmpeg subprocess and feeds Opus frames to all connections.
// Returns when FFmpeg exits or stop is closed.
func (p *Player) runFFmpeg(encoder *gopus.Encoder, stop chan struct{}) error {
	cmd := exec.Command(
		"ffmpeg",
		"-reconnect", "1",
		"-reconnect_streamed", "1",
		"-reconnect_delay_max", "5",
		"-i", radioURL,
		"-f", "s16le",
		"-ar", "48000",
		"-ac", "2",
		"pipe:1",
	)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	if err := cmd.Start(); err != nil {
		return err
	}

	// Kill FFmpeg when stop is signalled
	done := make(chan struct{})
	defer close(done)
	go func() {
		select {
		case <-stop:
			cmd.Process.Kill()
		case <-done:
		}
	}()

	pcm := make([]int16, frameSize*channels)
	buf := make([]byte, frameSize*channels*2)

	for {
		select {
		case <-stop:
			cmd.Process.Kill()
			cmd.Wait()
			return nil
		default:
		}

		if _, err := io.ReadFull(stdout, buf); err != nil {
			cmd.Wait()
			return err
		}

		// Convert bytes to int16 samples (little-endian)
		for i := range pcm {
			pcm[i] = int16(binary.LittleEndian.Uint16(buf[i*2:]))
		}

		opusData, err := encoder.Encode(pcm, frameSize, maxBytes)
		if err != nil {
			log.Printf("Opus encode error: %v", err)
			continue
		}

		// Send to all active connections
		p.mu.Lock()
		for _, vc := range p.connections {
			select {
			case vc.OpusSend <- opusData:
			default:
				// Drop frame if the channel is full (connection lagging)
			}
		}
		p.mu.Unlock()
	}
}
