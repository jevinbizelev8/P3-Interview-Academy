import { execFileSync } from "node:child_process";

function runGh(...args: string[]) {
  try {
    const out = execFileSync("gh", ["api", ...args], { encoding: "utf8" });
    return out;
  } catch (e: any) {
    process.stderr.write(e?.stdout || e?.message || String(e));
    process.exit(1);
  }
}

function main() {
  if (!process.env.GITHUB_TOKEN && !process.env.GH_TOKEN) {
    console.error("GITHUB_TOKEN not set. Set it in your environment.");
    process.exit(1);
  }
  const login = runGh("user", "--jq", ".login").trim();
  const reposJson = runGh("user/repos", "--paginate", "--jq", ".[ ].full_name");
  console.log(JSON.stringify({ login, repos: reposJson.split(/\r?\n/).filter(Boolean).slice(0, 20) }, null, 2));
}

main();

