# xcode-context-mcp 🛠️

> Give AI assistants real Xcode project context.  
> Dale a los asistentes de IA contexto real de tu proyecto Xcode.

![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🌐 Language Switch

- [🇺🇸 English](#-english)
- [🇪🇸 Español](#-español)

---

## 🇺🇸 English

### ✨ What It Does

`xcode-context-mcp` is an MCP server that exposes your Xcode project through tools so your AI assistant can reason with actual project data, not guesses.

### 🧰 Tools

| Tool | Description |
|------|-------------|
| `get_project_structure` | Returns the project tree + Swift files snapshot |
| `get_build_settings` | Extracts deployment target, bundle ID, Swift version, team, etc. |
| `get_dependencies` | Reads dependency manifests (SPM/CocoaPods/Cartfile), including nested paths |
| `get_entitlements` | Returns `.entitlements` content |
| `find_swift_file` | Finds a Swift file by name and returns content |
| `analyze_swift_file` | 🤖 AI code review for smells/architecture/memory risks |
| `generate_unit_tests` | 🤖 Generates XCTest tests from Swift source |

> 🤖 AI tools require API key configuration.

### 🤖 AI Provider Configuration

Use `.env`:

```bash
# Claude / Anthropic
LLM_PROVIDER=anthropic
LLM_MODEL=claude-sonnet-4-20250514
LLM_API_KEY=sk-ant-...

# OpenAI
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o
LLM_API_KEY=sk-...

# Gemini (via OpenAI-compatible endpoint routing in current implementation)
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.0-flash
LLM_API_KEY=AI...

# Mistral
LLM_PROVIDER=mistral
LLM_MODEL=mistral-large-latest
LLM_API_KEY=...
```

### 🚀 Setup

```bash
git clone https://github.com/frxcisxo/xcode-context-mcp.git
cd xcode-context-mcp
npm install
cp .env.example .env
npm run build
```

### ⚙️ MCP Client Setup

#### Cursor (`.cursor/mcp.json`)

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

#### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)

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

#### VS Code (`.vscode/mcp.json`)

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

### 💬 Prompt Examples

```text
Analyze the structure of my Xcode project at /Users/yourname/Projects/MyApp
```

```text
Find AuthManager.swift in /Users/yourname/Projects/MyApp and generate XCTest tests
```

```text
Check entitlements + build settings at /Users/yourname/Projects/MyApp and highlight risks
```

### ✅ Production Readiness (Current)

- ✅ TypeScript build passes (`npm run build`)
- ✅ Core MCP tools respond over stdio
- ✅ `get_dependencies` finds nested SPM manifests
- ✅ Errors are returned as safe text payloads (no tool crash)
- ⚠️ Add CI (build + smoke test) before public launch
- ⚠️ Add release/tag workflow and semantic version bump process

---

## 🇪🇸 Español

### ✨ Qué Hace

`xcode-context-mcp` es un servidor MCP que expone tu proyecto Xcode como herramientas para que tu asistente de IA trabaje con datos reales del proyecto y no con suposiciones.

### 🧰 Herramientas

| Herramienta | Descripción |
|-------------|-------------|
| `get_project_structure` | Devuelve árbol del proyecto + snapshot de archivos Swift |
| `get_build_settings` | Extrae deployment target, bundle ID, versión Swift, team, etc. |
| `get_dependencies` | Lee manifests de dependencias (SPM/CocoaPods/Cartfile), incluso en subcarpetas |
| `get_entitlements` | Devuelve el contenido de `.entitlements` |
| `find_swift_file` | Busca archivo Swift por nombre y devuelve contenido |
| `analyze_swift_file` | 🤖 Revisión con IA de smells/arquitectura/riesgos de memoria |
| `generate_unit_tests` | 🤖 Genera tests XCTest desde código Swift |

> 🤖 Las herramientas de IA requieren API key configurada.

### 🤖 Configuración de Proveedor de IA

Configura `.env`:

```bash
# Claude / Anthropic
LLM_PROVIDER=anthropic
LLM_MODEL=claude-sonnet-4-20250514
LLM_API_KEY=sk-ant-...

# OpenAI
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o
LLM_API_KEY=sk-...

# Gemini (en esta implementación se enruta por endpoint OpenAI-compatible)
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.0-flash
LLM_API_KEY=AI...

# Mistral
LLM_PROVIDER=mistral
LLM_MODEL=mistral-large-latest
LLM_API_KEY=...
```

### 🚀 Instalación

```bash
git clone https://github.com/frxcisxo/xcode-context-mcp.git
cd xcode-context-mcp
npm install
cp .env.example .env
npm run build
```

### ⚙️ Configuración MCP por Cliente

#### Cursor (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "xcode-context-mcp": {
      "command": "node",
      "args": ["/ruta/absoluta/a/xcode-context-mcp/dist/index.js"]
    }
  }
}
```

#### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "xcode-context-mcp": {
      "command": "node",
      "args": ["/ruta/absoluta/a/xcode-context-mcp/dist/index.js"]
    }
  }
}
```

#### VS Code (`.vscode/mcp.json`)

```json
{
  "servers": {
    "xcode-context-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/ruta/absoluta/a/xcode-context-mcp/dist/index.js"]
    }
  }
}
```

### 💬 Ejemplos de Prompts

```text
Analiza la estructura de mi proyecto Xcode en /Users/tuusuario/Proyectos/MiApp
```

```text
Busca AuthManager.swift en /Users/tuusuario/Proyectos/MiApp y genera tests XCTest
```

```text
Revisa entitlements + build settings en /Users/tuusuario/Proyectos/MiApp y marca riesgos
```

### ✅ Estado para Producción (Actual)

- ✅ Compilación TypeScript correcta (`npm run build`)
- ✅ Tools MCP principales responden por stdio
- ✅ `get_dependencies` encuentra manifests SPM en rutas anidadas
- ✅ Errores devueltos como texto seguro (sin crash de tool)
- ⚠️ Recomendado: CI con build + smoke tests antes de release público
- ⚠️ Recomendado: flujo de versionado/release semántico

---

## 👨‍💻 Author / Autor

Built by [Francisco](https://github.com/frxcisxo) 🚀

## 📄 License / Licencia

MIT