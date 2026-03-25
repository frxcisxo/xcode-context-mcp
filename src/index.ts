import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerProjectStructureTool } from "./tools/projectStructure.js";
import { registerDependenciesTool } from "./tools/dependencies.js";
import { registerFindSwiftFileTool } from "./tools/findSwiftFile.js";
import { registerBuildSettingsTool } from "./tools/buildSettings.js";
import { registerEntitlementsTool } from "./tools/entitlements.js";
import { registerAnalyzeSwiftFileTool } from "./tools/analyzeSwiftFile.js";
import { registerGenerateUnitTestsTool } from "./tools/generateUnitTests.js";

const server = new McpServer({
  name: "xcode-context-mcp",
  version: "1.0.0",
});

registerProjectStructureTool(server);
registerDependenciesTool(server);
registerFindSwiftFileTool(server);
registerBuildSettingsTool(server);
registerEntitlementsTool(server);
registerAnalyzeSwiftFileTool(server);
registerGenerateUnitTestsTool(server);

async function start() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("xcode-context-mcp running...");
}

start().catch(console.error);