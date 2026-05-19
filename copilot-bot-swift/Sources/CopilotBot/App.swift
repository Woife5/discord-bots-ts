import DiscordBM
import AsyncHTTPClient
import Foundation
import NIOPosix

@main
struct EntryPoint {
    static func main() async throws {
        let env = Config.loadEnv()

        guard let resourceURL = Bundle.module.url(forResource: "system-message", withExtension: "txt"),
              let systemMessage = try? String(contentsOf: resourceURL, encoding: .utf8)
        else {
            fputs("Could not load system-message.txt\n", stderr)
            exit(1)
        }

        let history = ChatHistory(systemMessage: systemMessage)

        let httpClient = HTTPClient.shared
        let openRouter = OpenRouterClient(apiKey: env.openRouterKey, httpClient: httpClient)

        let bot = await BotGatewayManager(
            eventLoopGroup: httpClient.eventLoopGroup,
            httpClient: httpClient,
            token: env.botToken,
            intents: [.guilds, .guildMessages, .directMessages, .messageContent]
        )

        // Register slash commands after connecting
        Task {
            try? await Task.sleep(nanoseconds: 3_000_000_000)
            let adminPerm: [Permission] = [.administrator]
            let commands: [Payloads.ApplicationCommandCreate] = [
                .init(name: "help", description: "Get help with Microsoft Copilot."),
                .init(
                    name: "history",
                    description: "Edit the chat history.",
                    options: [
                        .init(
                            type: .string,
                            name: "command",
                            description: "The command to execute on the chat history.",
                            required: true,
                            choices: [
                                .init(name: "clear", value: .string("clear")),
                                .init(name: "length", value: .string("length")),
                            ]
                        )
                    ],
                    default_member_permissions: adminPerm
                ),
                .init(
                    name: "systemmessage",
                    description: "Edit the system message.",
                    options: [
                        .init(
                            type: .string,
                            name: "message",
                            description: "The new system message.",
                            required: false
                        )
                    ],
                    default_member_permissions: adminPerm
                ),
            ]

            _ = try? await bot.client.bulkSetApplicationCommands(
                payload: commands
            ).guardSuccess()
            print("Slash commands registered.")
        }

        // Track bot user ID from Ready event
        let botUserIDBox = BotUserIDBox()

        await withTaskGroup(of: Void.self) { group in
            group.addTask { await bot.connect() }

            group.addTask {
                for await event in await bot.events {
                    await handleEvent(
                        event: event,
                        client: bot.client,
                        history: history,
                        openRouter: openRouter,
                        botUserIDBox: botUserIDBox
                    )
                }
            }
        }
    }
}

/// Simple actor to hold the bot's own user ID (populated from Ready event).
actor BotUserIDBox {
    var id: UserSnowflake?
    func set(_ id: UserSnowflake) { self.id = id }
    func get() -> UserSnowflake? { id }
}

private func handleEvent(
    event: Gateway.Event,
    client: any DiscordClient,
    history: ChatHistory,
    openRouter: OpenRouterClient,
    botUserIDBox: BotUserIDBox
) async {
    switch event.data {
    case let .ready(ready):
        await botUserIDBox.set(ready.user.id)
        print("Bot logged in as \(ready.user.username)#\(ready.user.discriminator ?? "0")")

    case let .interactionCreate(interaction):
        await handleInteraction(interaction: interaction, client: client, history: history)

    case let .messageCreate(message):
        await handleMessage(
            message: message,
            client: client,
            history: history,
            openRouter: openRouter,
            botUserID: await botUserIDBox.get()
        )

    default:
        break
    }
}

private func handleInteraction(
    interaction: Interaction,
    client: any DiscordClient,
    history: ChatHistory
) async {
    guard case let .applicationCommand(data) = interaction.data else { return }
    switch data.name {
    case "help":
        await handleHelp(interaction: interaction, client: client)
    case "history":
        await handleHistory(interaction: interaction, client: client, history: history)
    case "systemmessage":
        await handleSystemMessage(interaction: interaction, client: client, history: history)
    default:
        break
    }
}

private func handleMessage(
    message: Gateway.MessageCreate,
    client: any DiscordClient,
    history: ChatHistory,
    openRouter: OpenRouterClient,
    botUserID: UserSnowflake?
) async {
    // Ignore bot messages
    guard message.author?.bot != true else { return }

    let isMentioned = message.mentions.contains(where: { $0.id == botUserID })
    let isDM = message.guild_id == nil

    guard isMentioned || isDM else { return }

    let channelID = message.channel_id

    // Show typing indicator
    let typingTask = Task {
        while !Task.isCancelled {
            _ = try? await client.triggerTypingIndicator(channelId: channelID)
            try? await Task.sleep(nanoseconds: 9_500_000_000)
        }
    }
    defer { typingTask.cancel() }

    // Clean the message content: remove all <@ID> and <@!ID> mentions
    var content = message.content
    // Use NSRegularExpression for broader platform compatibility
    let mentionPattern = try! NSRegularExpression(pattern: "<@!?\\d+>")
    let range = NSRange(content.startIndex..., in: content)
    content = mentionPattern.stringByReplacingMatches(in: content, range: range, withTemplate: "")
    content = content.replacingOccurrences(of: "@Copilot ", with: "")
    content = content.trimmingCharacters(in: .whitespaces)

    // Get LLM response
    let messages = await history.snapshot(appendingUserMessage: content)
    let reply: String
    do {
        reply = try await openRouter.getChatCompletion(messages: messages)
    } catch {
        print("LLM error: \(error)")
        _ = try? await client.createMessage(
            channelId: channelID,
            payload: .init(content: Config.fallbackMessage)
        )
        return
    }

    guard !reply.isEmpty else {
        _ = try? await client.createMessage(
            channelId: channelID,
            payload: .init(content: Config.fallbackMessage)
        )
        return
    }

    // Persist to history only on success
    await history.append(role: "user", content: content)
    await history.append(role: "assistant", content: reply)

    // Send (split if needed)
    let chunks = reply.count <= 2000 ? [reply] : splitMessage(reply)
    for chunk in chunks {
        _ = try? await client.createMessage(
            channelId: channelID,
            payload: .init(content: chunk)
        )
    }
}
