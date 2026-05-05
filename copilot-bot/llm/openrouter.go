package llm

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

const (
	openRouterURL   = "https://openrouter.ai/api/v1/chat/completions"
	openRouterModel = "openrouter/free"
	maxRetries      = 5
	retryDelay      = 5 * time.Second
)

type chatCompletionRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

type chatCompletionResponse struct {
	ID      string `json:"id"`
	Choices []struct {
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type chatCompletionErrorResponse struct {
	Error struct {
		Message string `json:"message"`
		Code    int    `json:"code"`
	} `json:"error"`
}

// OpenRouterClient handles communication with the OpenRouter API.
type OpenRouterClient struct {
	apiKey     string
	httpClient *http.Client
}

// NewOpenRouterClient creates a new OpenRouter API client.
func NewOpenRouterClient(apiKey string) *OpenRouterClient {
	return &OpenRouterClient{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// GetChatCompletion sends messages to the OpenRouter API and returns the assistant's reply.
// It retries up to 5 times on rate limits (HTTP 429) or other errors.
func (c *OpenRouterClient) GetChatCompletion(messages []Message) (string, error) {
	return c.getChatCompletionWithRetry(messages, 0)
}

func (c *OpenRouterClient) getChatCompletionWithRetry(messages []Message, retry int) (string, error) {
	reqBody := chatCompletionRequest{
		Model:    openRouterModel,
		Messages: messages,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", openRouterURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		log.Printf("Error getting completion from model %s: %v", openRouterModel, err)
		if retry < maxRetries {
			log.Printf("Retrying... (%d)", retry+1)
			time.Sleep(retryDelay)
			return c.getChatCompletionWithRetry(messages, retry+1)
		}
		return "", fmt.Errorf("failed after %d retries: %w", maxRetries, err)
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	// Try to parse as error response first
	var errResp chatCompletionErrorResponse
	if err := json.Unmarshal(data, &errResp); err == nil && errResp.Error.Code != 0 {
		if errResp.Error.Code == 429 {
			log.Printf("Rate limit exceeded for model %s: %s Retrying in 5 seconds... (%d)",
				openRouterModel, errResp.Error.Message, retry+1)
			if retry < maxRetries {
				time.Sleep(retryDelay)
				return c.getChatCompletionWithRetry(messages, retry+1)
			}
		}
		return "", fmt.Errorf("OpenRouter API error (code %d): %s", errResp.Error.Code, errResp.Error.Message)
	}

	// Parse successful response
	var chatResp chatCompletionResponse
	if err := json.Unmarshal(data, &chatResp); err != nil {
		log.Printf("Error parsing completion response from model %s: %v", openRouterModel, err)
		if retry < maxRetries {
			log.Printf("Retrying... (%d)", retry+1)
			time.Sleep(retryDelay)
			return c.getChatCompletionWithRetry(messages, retry+1)
		}
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("no choices returned from OpenRouter")
	}

	return chatResp.Choices[0].Message.Content, nil
}
