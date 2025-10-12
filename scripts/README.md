MCP and CLI Demo Scripts

Overview
- MCP (model-friendly): scripts under `scripts/mcp/**`
- CLI (full coverage): scripts under `scripts/cli/**`

Prerequisites
- GitHub: set `GITHUB_TOKEN` (or `GH_TOKEN`)
- AWS: set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`

Commands
- MCP GitHub list repos: `npm run mcp:github:list-repos`
- CLI GitHub list repos: `npm run cli:github:list-repos`
- CLI AWS list buckets: `npm run cli:aws:list-buckets`

Notes
- MCP uses `@modelcontextprotocol/server-github` and returns structured results.
- AWS MCP is configured in `.codex/config.toml` but CLI script is provided for full coverage.
