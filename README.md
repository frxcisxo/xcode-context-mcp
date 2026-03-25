# xcode-context-mcp

> An MCP server that gives AI assistants full context of your Xcode project — enabling smarter, project-aware suggestions for iOS and macOS developers.

![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## The Problem

When working with AI assistants on iOS projects, you constantly need to paste code manually, explain your architecture, list your dependencies, and describe your project structure. The AI has no idea what you're building — so suggestions are generic and often wrong.

**xcode-context-mcp solves this.**

It exposes your Xcode project as a set of MCP tools, giving the AI real visibility into your codebase — structure, dependencies, build settings, entitlements, and individual Swift files — so every suggestion is tailored to *your* project.

---

## Features

| Tool | Description |
|------|-------------|
| `get_project_structure` | Returns the full file and folder tree of your Xcode project |
| `get_build_settings` | Extracts deployment target, bundle ID, Swift version, and more from `.xcodeproj` |
| `get_dependencies` | Reads SPM (`Package.swift`) and CocoaPods (`Podfile`) dependencies |
| `get_entitlements` | Lists all enabled capabilities from your `.entitlements` file |
| `find_swift_file` | Finds and returns the full content of any Swift file by name |
| `analyze_swift_file` | Uses AI to detect code smells, retain cycles, force unwrap risks, and architecture issues |
| `generate_unit_tests` | Generates XCTest unit tests for any Swift file using AI |

---

## AI Provider Support

This MCP server is **provider-agnostic**. Configure your preferred AI provider via environment variables:

```bash
# Anthropic (Claude)
LLM_PROVIDER=anthropic
LLM_API_KEY=sk-ant-...
LLM_MODEL=claude-sonnet-4-20250514

# OpenAI (GPT)
LLM_PROVIDER=openai
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o

# Google Gemini
LLM_PROVIDER=gemini
LLM_API_KEY=AI...
LLM_MODEL=gemini-2.0-flash

# Mistral
LLM_PROVIDER=mistral
LLM_API_KEY=...
LLM_MODEL=mistral-large-latest
```

---

## Installation

### Prerequisites

- Node.js 18+
- npm
- An MCP-compatible client (Claude Desktop, Cursor, VS Code, Windsurf)
- An API key from any supported AI provider

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/xcode-context-mcp.git
cd xcode-context-mcp

# 2. Install dependencies
npm install

# 3. Configure your AI provider
cp .env.example .env
# Edit .env with your API key and preferred provider

# 4. Build
npm run build
```

---

## Client Configuration

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "xcode-context-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/xcode-context-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop after saving.

---

### Cursor

Create or edit `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "xcode-context-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/xcode-context-mcp/dist/index.js"]
    }
  }
}
```

---

### VS Code (GitHub Copilot)

Create or edit `.vscode/mcp.json` in your project root:

```json
{
  "servers": {
    "xcode-context-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/xcode-context-mcp/dist/index.js"]
    }
  }
}
```

---

### Windsurf

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "xcode-context-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/xcode-context-mcp/dist/index.js"]
    }
  }
}
```

---

## Usage Examples

Once connected, ask your AI assistant naturally:

```
Analyze the structure of my Xcode project at /Users/yourname/Projects/MyApp

What dependencies is my project using?

Analyze ContentView.swift for code smells and architecture issues

Generate unit tests for AuthManager.swift

What are the build settings for my project?
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LLM_PROVIDER` | No | `anthropic` | AI provider (`anthropic`, `openai`, `gemini`, `mistral`) |
| `LLM_API_KEY` | Yes* | — | Your API key for the selected provider |
| `LLM_MODEL` | No | `claude-sonnet-4-20250514` | Model to use for AI-powered tools |

*Required only for `analyze_swift_file` and `generate_unit_tests`. The other tools work without an API key.

---

## Project Structure

```
xcode-context-mcp/
├── src/
│   └── index.ts          # MCP server and all tools
├── dist/                 # Compiled output (generated)
├── .env                  # Your local config (gitignored)
├── .env.example          # Template for new users
├── tsconfig.json
└── package.json
```

---

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Run compiled server
npm start
```

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## Author

Built by [Francisco](https://www.linkedin.com/in/YOUR_LINKEDIN) — Mobile Engineer with 9+ years of experience in iOS and Android development.

---

## License

MIT
