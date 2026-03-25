import { completion } from "litellm";

const provider = process.env.LLM_PROVIDER ?? "anthropic";
const model = process.env.LLM_MODEL ?? "claude-sonnet-4-20250514";
const apiKey =
  process.env.LLM_API_KEY ??
  // Common provider-specific fallbacks
  process.env.OPENAI_API_KEY ??
  process.env.ANTHROPIC_API_KEY ??
  process.env.GEMINI_API_KEY ??
  process.env.MISTRAL_API_KEY ??
  "";

export const isLLMConfigured = () => apiKey.length > 0;

function buildLitellmRequest(provider: string, model: string): { model: string; baseUrl?: string } {
  const p = provider.trim().toLowerCase();
  const m = model.trim();

  // litellm-js (0.12.x) does not expose a native gemini handler.
  // Route Gemini through its OpenAI-compatible endpoint using the OpenAI handler.
  if (p === "gemini") {
    const geminiModel = m.replace(/^gemini\//, "") || "gemini-2.0-flash";
    return {
      model: `openai/${geminiModel}`,
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    };
  }

  // Handler mapping expects these model-name prefixes (or raw model strings) in `params.model`.
  // We keep user-provided models when they already follow LiteLLM conventions.
  if (p === "mistral") {
    return { model: m.startsWith("mistral/") ? m : `mistral/${m}` };
  }
  if (p === "ollama") {
    return { model: m.startsWith("ollama/") ? m : `ollama/${m}` };
  }
  if (p === "replicate") {
    return { model: m.startsWith("replicate/") ? m : `replicate/${m}` };
  }
  if (p === "deepinfra") {
    return { model: m.startsWith("deepinfra/") ? m : `deepinfra/${m}` };
  }
  if (p === "openai") {
    if (m.startsWith("gpt-") || m.startsWith("openai/")) return { model: m };
    // If user passed a non-gpt model name, try explicit openai/ prefix.
    return { model: `openai/${m}` };
  }

  // Anthropic handler uses a `claude-...` prefix.
  // If user passes `claude-...` directly, this will work; if not, LiteLLM will throw a clear error later.
  if (p === "anthropic") return { model: m };
  if (p === "cohere") return { model: m }; // LiteLLM expects `command...` model names as-is.

  // Unknown provider: fall back to raw model string.
  return { model: m };
}

export function truncateText(text: string, maxChars: number): { text: string; truncated: boolean } {
  if (text.length <= maxChars) return { text, truncated: false };
  return { text: text.slice(0, maxChars), truncated: true };
}

export function stripCodeFences(text: string): string {
  // Prefer extracting the first fenced code block if present.
  const fenceRegex = /```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/;
  const match = text.match(fenceRegex);
  if (match?.[1]) return match[1].trim();
  // Fallback: remove any remaining fences and trim.
  return text.replace(/```[a-zA-Z0-9_-]*\n?/g, "").replace(/```/g, "").trim();
}

function extractChoiceContent(response: unknown): string | null {
  const r = response as any;
  const firstChoice = r?.choices?.[0];
  if (!firstChoice) return null;

  const content = firstChoice?.message?.content;
  if (typeof content === "string" && content.trim().length > 0) return content;

  // Some providers/tools might return a top-level `text` instead of `message.content`.
  const fallbackText = firstChoice?.text ?? r?.text;
  if (typeof fallbackText === "string" && fallbackText.trim().length > 0) return fallbackText;

  return null;
}

export async function askAI(prompt: string): Promise<string> {
  try {
    const request = buildLitellmRequest(provider, model);
    const response = await completion({
      model: request.model,
      apiKey: apiKey,
      baseUrl: request.baseUrl,
      messages: [{ role: "user", content: prompt }],
    });

    return extractChoiceContent(response) ?? "No response from AI";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`LLM request failed: ${message}`);
  }
}

export function requiresAPIKey() {
  return {
    content: [{
      type: "text" as const,
      text: `⚠️ This tool requires an AI provider configured in your .env file.\n\nExample:\nLLM_PROVIDER=anthropic\nLLM_API_KEY=your-key-here\nLLM_MODEL=claude-sonnet-4-20250514`,
    }],
  };
}