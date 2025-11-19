import fs from "node:fs";
import path from "node:path";

function fmt(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function main() {
  const now = new Date();
  const year = now.getFullYear();
  const month = fmt(now.getMonth() + 1); // 1-12
  const dir = path.join("docs", "ops-log");
  const file = path.join(dir, `${year}-${month}.md`);

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(file)) {
    console.log(`Ops log already exists: ${file}`);
    process.exit(0);
  }

  const header = `# Ops Log — ${year}-${month}\n\n`;
  const body = [
    `${year}-${month}-01`,
    "- Seeded monthly ops log.",
    "",
    "References",
    "- Changelog: `CHANGELOG.md`",
    "- Master Plan: `docs/redesign/MASTER_PLAN.md`",
    "- Deployment: `DEPLOYMENT.md`",
    "",
  ].join("\n");

  fs.writeFileSync(file, header + body, { encoding: "utf8" });
  console.log(`Created ops log: ${file}`);
}

main();
