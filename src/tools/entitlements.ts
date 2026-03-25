import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { findFileByExtension, readFileLimited, validateProjectPath } from "../utils/fs.js";

export function registerEntitlementsTool(server: McpServer) {
  server.tool(
    "get_entitlements",
    "Reads the entitlements file to list enabled app capabilities",
    {
      project_path: z.string().describe("Absolute path to the Xcode project folder"),
    },
    async ({ project_path }) => {
      const validated = validateProjectPath(project_path);
      if (validated.ok === false) {
        return { content: [{ type: "text" as const, text: `Error: ${validated.error}` }] };
      }

      try {
        const entitlementsPath = findFileByExtension(project_path, ".entitlements", { maxDepth: 10, maxNodes: 30000 });
        const text = entitlementsPath
          ? (() => {
              const { text: content, truncated } = readFileLimited(entitlementsPath, 20000);
              return `// Path: ${entitlementsPath}\n\n${content}${truncated ? "\n\n[TRUNCATED]" : ""}`;
            })()
          : "No .entitlements file found in the project";
        return { content: [{ type: "text" as const, text }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: `Error: ${message}` }] };
      }
    }
  );
}
