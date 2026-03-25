import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

const server = new McpServer({
  name: "xcode-context-mcp",
  version: "1.0.0",
});

// ─── TOOL 1: Estructura del proyecto ────────────────────────────────────────
server.tool(
  "get_project_structure",
  "Returns the full file and folder structure of an Xcode project",
  {
    project_path: z.string().describe("Absolute path to the Xcode project folder"),
    depth: z.number().optional().default(3).describe("Max depth to traverse"),
  },
  async ({ project_path, depth }) => {
    try {
      const structure = walkDir(project_path, depth, 0);
      return {
        content: [{ type: "text", text: JSON.stringify(structure, null, 2) }],
      };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e}` }] };
    }
  }
);

// ─── TOOL 2: Dependencias SPM ────────────────────────────────────────────────
server.tool(
  "get_dependencies",
  "Reads Swift Package Manager dependencies from Package.swift or project manifest",
  {
    project_path: z.string().describe("Absolute path to the Xcode project folder"),
  },
  async ({ project_path }) => {
    try {
      const results: string[] = [];

      // Buscar Package.swift
      const packageSwift = path.join(project_path, "Package.swift");
      if (fs.existsSync(packageSwift)) {
        results.push("=== Package.swift ===");
        results.push(fs.readFileSync(packageSwift, "utf-8"));
      }

      // Buscar Podfile
      const podfile = path.join(project_path, "Podfile");
      if (fs.existsSync(podfile)) {
        results.push("=== Podfile ===");
        results.push(fs.readFileSync(podfile, "utf-8"));
      }

      if (results.length === 0) {
        return { content: [{ type: "text", text: "No dependency files found (Package.swift or Podfile)" }] };
      }

      return { content: [{ type: "text", text: results.join("\n\n") }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e}` }] };
    }
  }
);

// ─── TOOL 3: Buscar archivo Swift ────────────────────────────────────────────
server.tool(
  "find_swift_file",
  "Finds and returns the content of a Swift file by name within the project",
  {
    project_path: z.string().describe("Absolute path to the Xcode project folder"),
    file_name: z.string().describe("Name of the Swift file, e.g. ContentView.swift"),
  },
  async ({ project_path, file_name }) => {
    try {
      const found = findFile(project_path, file_name);
      if (!found) {
        return { content: [{ type: "text", text: `File ${file_name} not found` }] };
      }
      const content = fs.readFileSync(found, "utf-8");
      return { content: [{ type: "text", text: `// Path: ${found}\n\n${content}` }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e}` }] };
    }
  }
);

// ─── TOOL 4: Build Settings ──────────────────────────────────────────────────
server.tool(
  "get_build_settings",
  "Extracts key build settings from the .xcodeproj configuration",
  {
    project_path: z.string().describe("Absolute path to the Xcode project folder"),
  },
  async ({ project_path }) => {
    try {
      const xcodeproj = findXcodeProj(project_path);
      if (!xcodeproj) {
        return { content: [{ type: "text", text: "No .xcodeproj found" }] };
      }

      const pbxproj = path.join(xcodeproj, "project.pbxproj");
      if (!fs.existsSync(pbxproj)) {
        return { content: [{ type: "text", text: "project.pbxproj not found" }] };
      }

      const content = fs.readFileSync(pbxproj, "utf-8");

      // Extraer settings relevantes
      const deploymentTarget = content.match(/IPHONEOS_DEPLOYMENT_TARGET = (.+);/)?.[1];
      const bundleId = content.match(/PRODUCT_BUNDLE_IDENTIFIER = (.+);/)?.[1];
      const swiftVersion = content.match(/SWIFT_VERSION = (.+);/)?.[1];
      const productName = content.match(/PRODUCT_NAME = (.+);/)?.[1];

      const settings = {
        deployment_target: deploymentTarget ?? "Not found",
        bundle_identifier: bundleId ?? "Not found",
        swift_version: swiftVersion ?? "Not found",
        product_name: productName ?? "Not found",
        xcodeproj_path: xcodeproj,
      };

      return { content: [{ type: "text", text: JSON.stringify(settings, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e}` }] };
    }
  }
);

// ─── TOOL 5: Entitlements ────────────────────────────────────────────────────
server.tool(
  "get_entitlements",
  "Reads the entitlements file to list enabled capabilities",
  {
    project_path: z.string().describe("Absolute path to the Xcode project folder"),
  },
  async ({ project_path }) => {
    try {
      const entFile = findFileByExtension(project_path, ".entitlements");
      if (!entFile) {
        return { content: [{ type: "text", text: "No .entitlements file found" }] };
      }
      const content = fs.readFileSync(entFile, "utf-8");
      return { content: [{ type: "text", text: `// Path: ${entFile}\n\n${content}` }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e}` }] };
    }
  }
);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function walkDir(dirPath: string, maxDepth: number, currentDepth: number): object {
  if (currentDepth >= maxDepth) return {};
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const result: Record<string, any> = {};
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (["node_modules", "Pods", ".git", "DerivedData"].includes(entry.name)) continue;
    if (entry.isDirectory()) {
      result[entry.name + "/"] = walkDir(path.join(dirPath, entry.name), maxDepth, currentDepth + 1);
    } else {
      result[entry.name] = "file";
    }
  }
  return result;
}

function findFile(dirPath: string, fileName: string): string | null {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (["node_modules", "Pods", ".git", "DerivedData"].includes(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const found = findFile(fullPath, fileName);
      if (found) return found;
    } else if (entry.name === fileName) {
      return fullPath;
    }
  }
  return null;
}

function findFileByExtension(dirPath: string, ext: string): string | null {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (["node_modules", "Pods", ".git", "DerivedData"].includes(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const found = findFileByExtension(fullPath, ext);
      if (found) return found;
    } else if (entry.name.endsWith(ext)) {
      return fullPath;
    }
  }
  return null;
}

function findXcodeProj(dirPath: string): string | null {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.endsWith(".xcodeproj")) {
      return path.join(dirPath, entry.name);
    }
  }
  return null;
}

// ─── Start server ─────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("xcode-context-mcp running...");
}

main().catch(console.error);