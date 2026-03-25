import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as path from "path";
import { listFilesByExtension, validateProjectPath, walkDirectory } from "../utils/fs.js";

export function registerProjectStructureTool(server: McpServer) {
  server.tool(
    "get_project_structure",
    "Returns the full file and folder structure of an Xcode project",
    {
      project_path: z.string().describe("Absolute path to the Xcode project folder"),
      depth: z.number().optional().default(3).describe("Max depth to traverse"),
    },
    async ({ project_path, depth }) => {
      const validated = validateProjectPath(project_path);
      if (validated.ok === false) {
        return {
          content: [{ type: "text" as const, text: `Error: ${validated.error}` }],
        };
      }

      try {
        const { tree, truncated } = walkDirectory(project_path, depth, 0, { maxNodes: 8000 });
        const swiftFiles = listFilesByExtension(project_path, ".swift", {
          maxDepth: Math.min(depth + 2, 10),
          maxFiles: 200,
        });

        const relativePaths = swiftFiles.files
          .map((abs) => path.relative(project_path, abs))
          .sort();

        const notes: string[] = [];
        if (truncated) notes.push("Directory traversal truncated due to safety limits.");
        if (swiftFiles.truncated) notes.push("Swift files list truncated due to safety limits.");

        const text = [
          JSON.stringify(tree, null, 2),
          "",
          "Swift files (relative paths, first N):",
          relativePaths.length > 0 ? relativePaths.join("\n") : "No .swift files found (within limits).",
          notes.length > 0 ? `\nNotes:\n- ${notes.join("\n- ")}` : "",
        ].join("\n");

        return {
          content: [{ type: "text" as const, text }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: `Error: ${message}` }] };
      }
    }
  );
}