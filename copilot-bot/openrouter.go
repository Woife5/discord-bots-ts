package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

const (
	openRouterURL = "https://openrouter.ai/api/v1/chat/completions"
	openRouterModel = "openrouter/free"
	maxRetries      = 5
)

// OpenRouterClient wraps the HTTP calls to the OpenRouter API.
type OpenRouterClient struct {
	apiKey     string
	httpClient *http.Client
}

// Request/response types — Go uses struct tags (`json:"..."`) to control
// how structs are serialized to/from JSON. This replaces TypeScript's
// type definitions for API contracts.
type chatRequest struct {
	Model    string        `json:"model"`
	Messages []ChatMessage `json:"messages"`
}

type chatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type chatErrorResponse struct {
	Error *struct {
		Message string `json:"message"`
		Code    int    `json:"code"`
	} `json:"error"`
}

// NewOpenRouterClient creates a client with a pre-configured HTTP timeout.
func NewOpenRouterClient(apiKey string) *OpenRouterClient {
	return &OpenRouterClient{
		apiKey:     apiKey,
		httpClient: &http.Client{Timeout: 60 * time.Second},
	}
}

// GetChatCompletion sends messages to OpenRouter and returns the reply.
// It accepts a context.Context for cancellation/timeout — this is idiomatic Go
// for any function that does I/O. The caller controls the deadline.
func (c *OpenRouterClient) GetChatCompletion(ctx context.Context, messages []ChatMessage) (string, error) {
	body, err := json.Marshal(chatRequest{
		Model:    openRouterModel,
		Messages: messages,
	})
	if err != nil {
		return "", fmt.Errorf("marshaling request: %w", err)
	}

	// Retry loop — idiomatic Go uses a for loop, not recursion.
	// The select statement lets us cancel retries via context.
	var lastErr error
	for attempt := range maxRetries + 1 {
		reply, err := c.doRequest(ctx, body)
		if err == nil {
			return reply, nil
		}
		lastErr = err

		if attempt == maxRetries {
			break
		}

		log.Printf("OpenRouter request failed (attempt %d/%d): %v", attempt+1, maxRetries+1, err)

		// Wait before retrying, but respect context cancellation
		select {
		case <-ctx.Done():
			return "", ctx.Err()
		case <-time.After(5 * time.Second):
		}
	}

	return "", fmt.Errorf("openrouter failed after %d attempts: %w", maxRetries+1, lastErr)
}

// doRequest performs a single HTTP request to OpenRouter.
func (c *OpenRouterClient) doRequest(ctx context.Context, body []byte) (string, error) {
	// http.NewRequestWithContext ties the request lifecycle to the context
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, openRouterURL, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("sending request: %w", err)
	}
	defer resp.Body.Close()

	// Check HTTP status before parsing body
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var errResp chatErrorResponse
		_ = json.NewDecoder(resp.Body).Decode(&errResp)
		if errResp.Error != nil {
			return "", fmt.Errorf("API error %d: %s", errResp.Error.Code, errResp.Error.Message)
		}
		return "", fmt.Errorf("unexpected status %d", resp.StatusCode)
	}

	var result chatResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("decoding response: %w", err)
	}

	if len(result.Choices) == 0 {
		return "", fmt.Errorf("no choices returned")
	}

	return result.Choices[0].Message.Content, nil
}
