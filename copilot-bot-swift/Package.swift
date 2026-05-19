// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "copilot-bot",
    platforms: [
        .macOS(.v13),
    ],
    dependencies: [
        .package(url: "https://github.com/DiscordBM/DiscordBM", from: "1.0.0"),
        .package(url: "https://github.com/swift-server/async-http-client", from: "1.21.0"),
    ],
    targets: [
        .executableTarget(
            name: "CopilotBot",
            dependencies: [
                .product(name: "DiscordBM", package: "DiscordBM"),
                .product(name: "AsyncHTTPClient", package: "async-http-client"),
            ],
            path: "Sources/CopilotBot",
            resources: [
                .copy("Resources/system-message.txt"),
            ]
        ),
    ]
)
