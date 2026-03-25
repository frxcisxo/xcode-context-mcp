import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { findFileByName, readFileLimited, validateProjectPath } from "../utils/fs.js";

export function registerFindSwiftFileTool(server: McpServer) {
  server.tool(
    "find_swift_file",
    "Finds and returns the content of a Swift file by name within the project",
    {
      project_path: z.string().describe("Absolute path to the Xcode project folder"),
      file_name: z.string().describe("Name of the Swift file, e.g. ContentView.swift"),
    },
    async ({ project_path, file_name }) => {
      const validated = validateProjectPath(project_path);
      if (validated.ok === false) {
        return { content: [{ type: "text" as const, text: `Error: ${validated.error}` }] };
      }

      try {
        const filePath = findFileByName(project_path, file_name, { maxDepth: 12, maxNodes: 30000 });
        const text = filePath
          ? (() => {
              const { text: content, truncated } = readFileLimited(filePath, 50000);
              return `// Path: ${filePath}\n\n${content}${truncated ? "\n\n[TRUNCATED]" : ""}`;
            })()
          : `File "${file_name}" not found in ${project_path}`;

        return { content: [{ type: "text" as const, text }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: `Error: ${message}` }] };
      }
    }
  );
}