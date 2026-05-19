import Foundation

enum Config {
    static let copilotIcon = "https://registry.npmmirror.com/@lobehub/icons-static-png/1.29.0/files/dark/copilot-color.png"
    static let copilotWebLink = "https://copilot.microsoft.com"
    static let copilotAndroidLink = "https://play.google.com/store/apps/details?id=com.microsoft.copilot"
    static let copilotIOSLink = "https://apps.apple.com/at/app/microsoft-copilot/id6472538445"
    static let version = "1.0.0"

    static let fallbackMessage = """
        Hello, if you want to continue using Microsoft Copilot, please visit \
        [copilot.microsoft.com](<\(copilotWebLink)>) or download the mobile app today for \
        [Android](<\(copilotAndroidLink)>) or [iOS](<\(copilotIOSLink)>) devices.
        """

    struct Env {
        let botToken: String
        let clientID: String
        let openRouterKey: String
    }

    static func loadEnv() -> Env {
        func require(_ key: String) -> String {
            guard let value = ProcessInfo.processInfo.environment[key], !value.isEmpty else {
                fputs("Missing required environment variable: \(key)\n", stderr)
                exit(1)
            }
            return value
        }
        return Env(
            botToken: require("BOT_TOKEN"),
            clientID: require("CLIENT_ID"),
            openRouterKey: require("OPENROUTER_KEY")
        )
    }
}
