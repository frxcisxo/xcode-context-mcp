import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as fs from "fs";
import { readFileLimited, validateProjectPath } from "../utils/fs.js";
import * as path from "path";

const MANIFESTS = [
  { label: "Package.swift", fileName: "Package.swift", maxChars: 200000 },
  { label: "Podfile", fileName: "Podfile", maxChars: 200000 },
  { label: "Package.resolved", fileName: "Package.resolved", maxChars: 400000 },
  { label: "Podfile.lock", fileName: "Podfile.lock", maxChars: 400000 },
  { label: "Cartfile", fileName: "Cartfile", maxChars: 200000 },
] as const;

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "DerivedData",
  "Pods",
  ".build",
  ".swiftpm",
  "build",
  "Carthage",
]);

function findDependencyFilesRecursively(
  rootPath: string,
  opts: { maxDepth?: number; maxNodes?: number } = {}
): Array<{ label: string; filePath: string; maxChars: number }> {
  const maxDepth = opts.maxDepth ?? 8;
  const maxNodes = opts.maxNodes ?? 15000;
  const found: Array<{ label: string; filePath: string; maxChars: number }> = [];
  const visited = { nodes: 0 };
  const manifestMap = new Map<string, (typeof MANIFESTS)[number]>(MANIFESTS.map((m) => [m.fileName, m]));

  function walk(currentDir: string, depth: number) {
    if (depth > maxDepth || visited.nodes >= maxNodes) return;

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (visited.nodes >= maxNodes) return;
      if (entry.name.startsWith(".")) continue;
      visited.nodes += 1;

      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        walk(fullPath, depth + 1);
        continue;
      }

      const manifest = manifestMap.get(entry.name);
      if (manifest) {
        found.push({
          label: manifest.label,
          filePath: fullPath,
          maxChars: manifest.maxChars,
        });
      }
    }
  }

  walk(rootPath, 0);
  return found;
}

export function registerDependenciesTool(server: McpServer) {
  server.tool(
    "get_dependencies",
    "Reads Swift Package Manager and CocoaPods dependencies from the project",
    {
      project_path: z.string().describe("Absolute path to the Xcode project folder"),
    },
    async ({ project_path }) => {
      const validated = validateProjectPath(project_path);
      if (validated.ok === false) {
        return {
          content: [{ type: "text" as const, text: `Error: ${validated.error}` }],
        };
      }

      try {
        const dependencyFiles = findDependencyFilesRecursively(project_path, { maxDepth: 8, maxNodes: 15000 });

        const found = dependencyFiles
          .sort((a, b) => a.filePath.localeCompare(b.filePath))
          .map(({ label, filePath, maxChars }) => {
            const relativePath = path.relative(project_path, filePath);
            const { text: content, truncated } = readFileLimited(filePath, maxChars);
            return `=== ${label} (${relativePath}) ===\n${content}${truncated ? "\n\n[TRUNCATED]" : ""}`;
          });

        const text = found.length > 0
          ? found.join("\n\n")
          : "No dependency manifest files found (Package.swift / Podfile / Package.resolved / Podfile.lock / Cartfile).";

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