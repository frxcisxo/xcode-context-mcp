import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const projectPath = path.join(repoRoot, "fixtures", "ci-xcode-project");
const serverPath = path.join(repoRoot, "dist", "index.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  const client = new Client({ name: "ci-smoke-client", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
    cwd: repoRoot,
    env: {
      LLM_API_KEY: "",
      LLM_PROVIDER: "anthropic",
      LLM_MODEL: "claude-sonnet-4-20250514",
    },
  });

  await client.connect(transport);
  try {
    const tools = await client.listTools();
    assert(tools.tools.length >= 7, "Expected at least 7 registered tools");

    const structure = await client.callTool({
      name: "get_project_structure",
      arguments: { project_path: projectPath, depth: 3 },
    });
    const structureText = structure?.content?.[0]?.text ?? "";
    assert(structureText.includes("App.swift"), "Project structure should include App.swift");

    const build = await client.callTool({
      name: "get_build_settings",
      arguments: { project_path: projectPath },
    });
    const buildText = build?.content?.[0]?.text ?? "";
    assert(buildText.includes("bundle_identifier"), "Build settings should include bundle_identifier");

    const deps = await client.callTool({
      name: "get_dependencies",
      arguments: { project_path: projectPath },
    });
    const depsText = deps?.content?.[0]?.text ?? "";
    assert(depsText.includes("Package.resolved"), "Dependencies should include Package.resolved");

    console.log("Smoke test passed.");
  } finally {
    await transport.close();
  }
}

run().catch((error) => {
  console.error("Smoke test failed:", error?.message ?? error);
  process.exit(1);
});
