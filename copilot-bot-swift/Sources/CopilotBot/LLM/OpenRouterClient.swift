import AsyncHTTPClient
import Foundation
import NIOCore
import NIOFoundationCompat

private let openRouterURL = "https://openrouter.ai/api/v1/chat/completions"
private let openRouterModel = "openrouter/free"
private let maxRetries = 5
private let retryDelay: UInt64 = 5_000_000_000 // 5 seconds in nanoseconds

private struct ChatCompletionRequest: Encodable {
    let model: String
    let messages: [ChatMessage]
}

private struct ChatCompletionResponse: Decodable {
    struct Choice: Decodable {
        struct Message: Decodable {
            let role: String
            let content: String
        }
        let message: Message
    }
    let choices: [Choice]
}

private struct ChatCompletionErrorResponse: Decodable {
    struct APIError: Decodable {
        let message: String
        let code: Int
    }
    let error: APIError?
}

actor OpenRouterClient {
    private let apiKey: String
    private let httpClient: HTTPClient

    init(apiKey: String, httpClient: HTTPClient) {
        self.apiKey = apiKey
        self.httpClient = httpClient
    }

    func getChatCompletion(messages: [ChatMessage]) async throws -> String {
        return try await withRetry(attempt: 0, messages: messages)
    }

    private func withRetry(attempt: Int, messages: [ChatMessage]) async throws -> String {
        do {
            return try await performRequest(messages: messages)
        } catch OpenRouterError.rateLimited(let msg) {
            guard attempt < maxRetries else {
                throw OpenRouterError.rateLimited(msg)
            }
            print("Rate limited: \(msg). Retrying (\(attempt + 1))...")
            try await Task.sleep(nanoseconds: retryDelay)
            return try await withRetry(attempt: attempt + 1, messages: messages)
        } catch {
            guard attempt < maxRetries else { throw error }
            print("Error: \(error). Retrying (\(attempt + 1))...")
            try await Task.sleep(nanoseconds: retryDelay)
            return try await withRetry(attempt: attempt + 1, messages: messages)
        }
    }

    private func performRequest(messages: [ChatMessage]) async throws -> String {
        let body = ChatCompletionRequest(model: openRouterModel, messages: messages)
        let bodyData = try JSONEncoder().encode(body)

        var request = HTTPClientRequest(url: openRouterURL)
        request.method = .POST
        request.headers.add(name: "Authorization", value: "Bearer \(apiKey)")
        request.headers.add(name: "Content-Type", value: "application/json")
        request.body = .bytes(ByteBuffer(data: bodyData))

        let response = try await httpClient.execute(request, timeout: .seconds(60))
        let responseData = try await response.body.collect(upTo: 1024 * 1024) // 1 MB

        // Check for API-level error
        if let errResp = try? JSONDecoder().decode(ChatCompletionErrorResponse.self, from: responseData),
           let apiError = errResp.error,
           apiError.code != 0 {
            if apiError.code == 429 {
                throw OpenRouterError.rateLimited(apiError.message)
            }
            throw OpenRouterError.apiError(code: apiError.code, message: apiError.message)
        }

        let chatResp = try JSONDecoder().decode(ChatCompletionResponse.self, from: responseData)
        guard let first = chatResp.choices.first else {
            throw OpenRouterError.noChoices
        }
        return first.message.content
    }
}

enum OpenRouterError: Error {
    case rateLimited(String)
    case apiError(code: Int, message: String)
    case noChoices
}
