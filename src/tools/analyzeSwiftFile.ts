import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { findFileByName, readFileLimited, validateProjectPath } from "../utils/fs.js";
import { askAI, isLLMConfigured, requiresAPIKey, stripCodeFences, truncateText } from "../utils/llm.js";

const buildAnalysisPrompt = (fileName: string, code: string) => `
You are an expert iOS developer. Analyze this Swift file and provide:

1. Code smells or anti-patterns
2. Potential retain cycles or memory issues
3. Force unwrap risks
4. Architecture suggestions
5. Quick wins to improve the code

File: ${fileName}

\`\`\`swift
${code}
\`\`\`

Be concise and practical.
`.trim();

export function registerAnalyzeSwiftFileTool(server: McpServer) {
  server.tool(
    "analyze_swift_file",
    "Uses AI to analyze a Swift file and detect issues, code smells, and improvement opportunities",
    {
      project_path: z.string().describe("Absolute path to the Xcode project folder"),
      file_name: z.string().describe("Name of the Swift file to analyze"),
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

        const { text: fileContent, truncated } = readFileLimited(filePath, 40000);
        const { text: safeContent } = truncateText(fileContent, 40000);
        const analysis = await askAI(buildAnalysisPrompt(file_name, safeContent) + (truncated ? "\n\n[INPUT TRUNCATED]" : ""));

        return {
          content: [{ type: "text" as const, text: stripCodeFences(analysis) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: `Error: ${message}` }] };
      }
    }
  );
}