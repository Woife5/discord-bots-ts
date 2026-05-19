import DiscordBM
import Foundation

// MARK: - /help

func handleHelp(
    interaction: Interaction,
    client: any DiscordClient
) async {
    let embed = Embed(
        title: "Microsoft Copilot",
        description: Config.fallbackMessage,
        color: .init(value: 0xFFFFFF),
        author: .init(name: "Copilot", icon_url: .exact(Config.copilotIcon))
    )

    _ = try? await client.createInteractionResponse(
        id: interaction.id,
        token: interaction.token,
        payload: .channelMessageWithSource(.init(embeds: [embed]))
    )
}

// MARK: - /history

func handleHistory(
    interaction: Interaction,
    client: any DiscordClient,
    history: ChatHistory
) async {
    guard case let .applicationCommand(data) = interaction.data,
          let commandOption = data.options?.first,
          let value = commandOption.value,
          case let .string(command) = value
    else { return }

    let adminEmbed = { (description: String) -> Embed in
        Embed(
            description: description,
            color: .init(value: 0x00FFFF),
            author: .init(name: "Copilot", icon_url: .exact(Config.copilotIcon))
        )
    }

    switch command {
    case "length":
        let count = await history.length()
        let embed = adminEmbed("Current chat history length: `\(count)`")
        _ = try? await client.createInteractionResponse(
            id: interaction.id,
            token: interaction.token,
            payload: .channelMessageWithSource(.init(embeds: [embed]))
        )

    case "clear":
        await history.clear()
        let embed = adminEmbed("Chat history has been cleared.")
        _ = try? await client.createInteractionResponse(
            id: interaction.id,
            token: interaction.token,
            payload: .channelMessageWithSource(.init(embeds: [embed]))
        )

    default:
        break
    }
}

// MARK: - /systemmessage

func handleSystemMessage(
    interaction: Interaction,
    client: any DiscordClient,
    history: ChatHistory
) async {
    guard case let .applicationCommand(data) = interaction.data else { return }

    let newMessage = data.options?
        .first(where: { $0.name == "message" })
        .flatMap { opt -> String? in
            if case let .string(s) = opt.value { return s }
            return nil
        }

    if let newMessage, !newMessage.isEmpty {
        await history.setSystemMessage(newMessage)
        _ = try? await client.createInteractionResponse(
            id: interaction.id,
            token: interaction.token,
            payload: .channelMessageWithSource(.init(
                content: "**System message updated to:**\n\(newMessage)"
            ))
        )
    } else {
        let current = await history.getSystemMessage()
        _ = try? await client.createInteractionResponse(
            id: interaction.id,
            token: interaction.token,
            payload: .channelMessageWithSource(.init(
                content: "**Current system message:**\n\(current)"
            ))
        )
    }
}
