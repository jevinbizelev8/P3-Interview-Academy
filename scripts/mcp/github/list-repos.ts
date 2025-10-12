import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio";

async function main() {
  if (!process.env.GITHUB_TOKEN && !process.env.GH_TOKEN) {
    console.error("GITHUB_TOKEN not set. Set it in your environment.");
    process.exit(1);
  }

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: { ...process.env },
  });

  const client = new Client({ name: "codex-mcp-demo", version: "1.0.0", transport });
  await client.connect();

  const tools = await client.listTools();
  const repoTool = tools.tools.find((t) => /list.*repo/i.test(t.name));
  if (!repoTool) {
    console.error("Could not find a repository listing tool. Tools: ", tools.tools.map(t => t.name));
    await transport.close();
    process.exit(1);
  }

  const result = await client.callTool({ name: repoTool.name, arguments: {} });
  console.log(JSON.stringify(result, null, 2));

  await transport.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
