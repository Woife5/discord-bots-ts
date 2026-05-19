import Foundation

private let maxLength = 2000

private struct MarkdownPair {
    let pattern: NSRegularExpression
    let name: String
}

private let markdownPairs: [MarkdownPair] = [
    makePattern("```", name: "code block"),
    makePattern("``", name: "inline code 2"),
    makePattern("`", name: "inline code"),
    makePattern(#"\*\*"#, name: "bold"),
    makePattern("__", name: "underline bold"),
    makePattern(#"\|\|"#, name: "spoiler"),
    makePattern("~~", name: "strikethrough"),
    makePattern(#"(?:^|[^*])\*(?:[^*]|$)"#, name: "italic *"),
    makePattern(#"(?:^|[^_])_(?:[^_]|$)"#, name: "italic _"),
]

private func makePattern(_ pattern: String, name: String) -> MarkdownPair {
    let regex = try! NSRegularExpression(pattern: pattern, options: [.anchorsMatchLines])
    return MarkdownPair(pattern: regex, name: name)
}

private func countMatches(in text: String, pattern: NSRegularExpression) -> Int {
    pattern.numberOfMatches(in: text, range: NSRange(text.startIndex..., in: text))
}

private func hasUnclosedMarkdown(_ chunk: String) -> Bool {
    for pair in markdownPairs {
        if countMatches(in: chunk, pattern: pair.pattern) % 2 != 0 {
            return true
        }
    }
    return false
}

private func findSafeSplitPoint(in text: String, maxLen: Int) -> String.Index {
    let clampedEnd = text.index(text.startIndex, offsetBy: min(maxLen, text.count))
    let prefix = String(text[..<clampedEnd])

    // Try newline
    if let idx = prefix.range(of: "\n", options: .backwards)?.lowerBound,
       text.distance(from: text.startIndex, to: idx) > maxLen / 2 {
        let chunk = String(text[..<idx])
        if !hasUnclosedMarkdown(chunk) {
            return text.index(after: idx) // skip the newline itself
        }
    }

    // Try paragraph break
    if let idx = prefix.range(of: "\n\n", options: .backwards)?.lowerBound,
       text.distance(from: text.startIndex, to: idx) > maxLen * 3 / 10 {
        let chunk = String(text[..<idx])
        if !hasUnclosedMarkdown(chunk) {
            return text.index(idx, offsetBy: 2)
        }
    }

    // Scan backwards for space/newline
    var i = clampedEnd
    let lowerBound = text.index(text.startIndex, offsetBy: maxLen * 3 / 10)
    while i > lowerBound {
        text.formIndex(before: &i)
        let ch = text[i]
        if ch == "\n" || ch == " " {
            let chunk = String(text[..<i])
            if !hasUnclosedMarkdown(chunk) {
                return ch == "\n" ? text.index(after: i) : i
            }
        }
    }

    // Last space
    if let idx = prefix.range(of: " ", options: .backwards)?.lowerBound,
       text.distance(from: text.startIndex, to: idx) > maxLen * 3 / 10 {
        return idx
    }

    // Hard cut
    return clampedEnd
}

/// Splits a message into chunks of at most 2000 characters, respecting markdown boundaries.
func splitMessage(_ message: String) -> [String] {
    var chunks: [String] = []
    var remaining = message

    while !remaining.isEmpty {
        if remaining.count <= maxLength {
            chunks.append(remaining)
            break
        }
        let splitIndex = findSafeSplitPoint(in: remaining, maxLen: maxLength)
        let chunk = String(remaining[..<splitIndex]).trimmingCharacters(in: .whitespaces)
        if !chunk.isEmpty {
            chunks.append(chunk)
        }
        remaining = String(remaining[splitIndex...]).trimmingCharacters(in: .whitespaces)
    }

    return chunks
}
