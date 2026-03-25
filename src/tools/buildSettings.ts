import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { findXcodeProjPath, fileExists, readFileLimited, validateProjectPath } from "../utils/fs.js";
import * as path from "path";

const SETTINGS_PATTERNS: Record<string, RegExp> = {
  deployment_target: /IPHONEOS_DEPLOYMENT_TARGET\s*=\s*([^;]+);/,
  bundle_identifier: /PRODUCT_BUNDLE_IDENTIFIER\s*=\s*([^;]+);/,
  swift_version: /SWIFT_VERSION\s*=\s*([^;]+);/,
  product_name: /PRODUCT_NAME\s*=\s*([^;]+);/,
  marketing_version: /MARKETING_VERSION\s*=\s*([^;]+);/,
  current_project_version: /CURRENT_PROJECT_VERSION\s*=\s*([^;]+);/,
  development_team: /DEVELOPMENT_TEAM\s*=\s*([^;]+);/,
};

function extractBuildSettings(pbxprojContent: string): Record<string, string> {
  return Object.fromEntries(
    Object.entries(SETTINGS_PATTERNS).map(([key, pattern]) => [
      key,
      (pbxprojContent.match(pattern)?.[1] ?? "Not found").trim().replace(/^"|"$/g, ""),
    ])
  );
}

export function registerBuildSettingsTool(server: McpServer) {
  server.tool(
    "get_build_settings",
    "Extracts key build settings from the .xcodeproj configuration",
    {
      project_path: z.string().describe("Absolute path to the Xcode project folder"),
    },
    async ({ project_path }) => {
      const validated = validateProjectPath(project_path);
      if (validated.ok === false) {
        return { content: [{ type: "text" as const, text: `Error: ${validated.error}` }] };
      }

      try {
        const xcodeprojPath = findXcodeProjPath(project_path, { maxDepth: 2 });

        if (!xcodeprojPath) {
          return { content: [{ type: "text" as const, text: "No .xcodeproj found in the given path" }] };
        }

        const pbxprojPath = path.join(xcodeprojPath, "project.pbxproj");

        if (!fileExists(pbxprojPath)) {
          return { content: [{ type: "text" as const, text: "project.pbxproj not found inside .xcodeproj" }] };
        }

        const { text: pbxContent, truncated } = readFileLimited(pbxprojPath, 400000);
        const settings = {
          ...extractBuildSettings(pbxContent),
          xcodeproj_path: xcodeprojPath,
          _note: truncated ? "project.pbxproj truncated for safety; some keys may be missing." : undefined,
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(settings, null, 2) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: `Error: ${message}` }] };
      }
    }
  );
}