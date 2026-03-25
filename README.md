# xcode-context-mcp 🛠️

> Make AI understand your Xcode project — not just read it.

AI-powered MCP server for Xcode, Swift, and iOS projects.
Enables LLMs to analyze, understand, and reason about real codebases instead of guessing.

![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🌐 Language

* 🇺🇸 English
* 🇪🇸 Español (más abajo)

---

## 🧠 Why this matters

Most AI tools for Xcode can:

* Read files
* Run commands

But they **don’t understand your app**.

`xcode-context-mcp` bridges that gap by exposing structured project data so AI can reason about:

* Architecture (MVVM, layers, flows)
* Dependencies (SPM, CocoaPods)
* Build configuration risks
* Code relationships across files

---

## ⚡ What makes this different

Unlike other Xcode MCP servers that focus on build/run automation,
this project focuses on **understanding code**.

It turns your project into a **reasoning layer for AI agents**.

---

## ✨ What It Does

`xcode-context-mcp` is an MCP server that exposes your Xcode project through tools so your AI assistant can work with real project data, not hallucinations.

---

## 🧪 Example

**User:**

```
Where is authentication handled?
```

**AI (using this MCP):**

* Finds `AuthManager.swift`
* Maps dependencies
* Explains flow from API → ViewModel → UI

---

## 🧰 Tools

| Tool                    | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `get_project_structure` | Returns project tree + Swift snapshot                      |
| `get_build_settings`    | Extracts deployment target, bundle ID, Swift version, etc. |
| `get_dependencies`      | Reads SPM / CocoaPods / Cartfile (including nested)        |
| `get_entitlements`      | Returns `.entitlements`                                    |
| `find_swift_file`       | Finds Swift file by name                                   |
| `analyze_swift_file`    | 🤖 AI code review (architecture, smells, memory risks)     |
| `generate_unit_tests`   | 🤖 Generates XCTest tests                                  |

---

## 🤖 AI Provider Configuration

Supports multiple LLM providers:

```bash
# Claude / Anthropic
LLM_PROVIDER=anthropic
LLM_MODEL=claude-sonnet-4-20250514
LLM_API_KEY=sk-ant-...

# OpenAI
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o
LLM_API_KEY=sk-...

# Gemini
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.0-flash
LLM_API_KEY=AI...

# Mistral
LLM_PROVIDER=mistral
LLM_MODEL=mistral-large-latest
LLM_API_KEY=...
```

---

## 🚀 Setup

```bash
git clone https://github.com/frxcisxo/xcode-context-mcp.git
cd xcode-context-mcp
npm install
cp .env.example .env
npm run build
```

---

## ⚙️ MCP Client Setup

### Cursor (`.cursor/mcp.json`)

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

### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)

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

### VS Code (`.vscode/mcp.json`)

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

## 💬 Prompt Examples

```text
Analyze the structure of my Xcode project
```

```text
Find AuthManager.swift and generate XCTest tests
```

```text
Check entitlements and build settings, highlight risks
```

---

## 🧱 Use Cases

* AI-assisted iOS development
* Codebase understanding for large projects
* Automated code reviews
* Test generation
* Architecture analysis

---

## 📈 Roadmap

* [ ] Semantic code search (embeddings)
* [ ] Swift AST parsing (SwiftSyntax)
* [ ] Architecture detection (MVVM, Clean)
* [ ] Cross-file dependency graph
* [ ] Xcode plugin integration

---

## 🇪🇸 Español

### ✨ Qué hace

`xcode-context-mcp` es un servidor MCP que expone tu proyecto Xcode como herramientas para que la IA trabaje con datos reales del proyecto, no con suposiciones.

---

### 🧠 Por qué importa

La mayoría de herramientas de IA para Xcode:

* Solo leen archivos
* O ejecutan comandos

Pero no entienden tu app.

Este proyecto permite que la IA razone sobre:

* Arquitectura
* Dependencias
* Riesgos
* Relaciones entre archivos

---

### 🧰 Herramientas

| Herramienta             | Descripción                                 |
| ----------------------- | ------------------------------------------- |
| `get_project_structure` | Árbol del proyecto + snapshot Swift         |
| `get_build_settings`    | Deployment target, bundle ID, versión Swift |
| `get_dependencies`      | SPM / CocoaPods / Cartfile                  |
| `get_entitlements`      | Contenido de `.entitlements`                |
| `find_swift_file`       | Busca archivo Swift                         |
| `analyze_swift_file`    | 🤖 Análisis con IA                          |
| `generate_unit_tests`   | 🤖 Generación de tests                      |

---

### 🚀 Instalación

```bash
git clone https://github.com/frxcisxo/xcode-context-mcp.git
cd xcode-context-mcp
npm install
cp .env.example .env
npm run build
```

---

### 💬 Ejemplos

```text
Analiza la estructura de mi proyecto Xcode
```

```text
Busca AuthManager.swift y genera tests
```

---

## 👨‍💻 Author

Built by Francisco Molina 🚀
iOS & Android Developer | Kotlin | Swift | AI tooling

---

## 📄 License

MIT
