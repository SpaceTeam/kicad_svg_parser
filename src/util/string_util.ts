export function indent(string: string): string {
    return string.trimEnd().split("\n").map(line => "\t"+line).join("\n")
}

export function sanitizeForCSS(string: string): string {
    return string.replace(":", "-")
}