import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { findFileByName, readFileLimited, validateProjectPath } from "../utils/fs.js";
import { askAI, isLLMConfigured, requiresAPIKey, stripCodeFences, truncateText } from "../utils/llm.js";

const buildTestGenerationPrompt = (fileName: string, code: string) => `
You are an expert iOS developer. Generate comprehensive XCTest unit tests for this Swift file.
Use XCTest, follow best practices, and mock dependencies where needed.

File: ${fileName}

\`\`\`swift
${code}
\`\`\`

Return only the Swift test file code, ready to paste into Xcode.
`.trim();

export function registerGenerateUnitTestsTool(server: McpServer) {
  server.tool(
    "generate_unit_tests",
    "Generates XCTest unit tests for a given Swift file using AI",
    {
      project_path: z.string().describe("Absolute path to the Xcode project folder"),
      file_name: z.string().describe("Name of the Swift file to generate tests for"),
    },
    async ({ project_path, file_name }) => {
      if (!isLLMConfigured()) return requiresAPIKey();

      const validated = validateProjectPath(project_path);
      if (validated.ok === false) {
        return { content: [{ type: "text" as const, text: `Error: ${validated.error}` }] };
      }

      try {
        const filePath = findFileByName(project_path, file_name, { maxDepth: 12, maxNodes: 30000 });
        if (!filePath) {
          return {
            content: [{ type: "text" as const, text: `File "${file_name}" not found in ${project_path}` }],
          };
        }

        const { text: fileContent, truncated } = readFileLimited(filePath, 45000);
        const { text: safeContent } = truncateText(fileContent, 45000);
        const raw = await askAI(
          buildTestGenerationPrompt(file_name, safeContent) + (truncated ? "\n\n[INPUT TRUNCATED]" : "")
        );

        let cleaned = stripCodeFences(raw);
        // Heuristic: keep only the portion that starts at XCTest import.
        const marker = "import XCTest";
        const idx = cleaned.indexOf(marker);
        if (idx >= 0) cleaned = cleaned.slice(idx);

        return {
          content: [{ type: "text" as const, text: cleaned }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: `Error: ${message}` }] };
      }
    }
  );
}