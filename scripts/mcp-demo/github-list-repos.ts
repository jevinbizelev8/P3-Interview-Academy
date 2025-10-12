import { Client } from "@modelcontextprotocol/sdk/client/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio";

async function main() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    console.error("GITHUB_TOKEN not set in environment.");
    process.exit(1);
  }

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: { ...process.env },
  });

  const client = new Client({
    name: "codex-mcp-demo",
    version: "1.0.0",
    transport,
  });

  await client.connect();

  const tools = await client.listTools();
  const listTool = tools.tools.find((t) => /repo/i.test(t.name));
  if (!listTool) {
    console.error("No repository listing tool exposed by server.");
    await transport.close();
    process.exit(1);
  }

  // Common tool names include: "list_repositories" or similar; call without args first.
  const result = await client.callTool({ name: listTool.name, arguments: {} });
  console.log(JSON.stringify(result, null, 2));

  await transport.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

