# Utility Scripts

Place ad-hoc deployment, schema maintenance, and debugging helpers in this directory.

## Guidelines

- Use `node deployment-scripts/util/<script>.js` (or `tsx` for TypeScript) when running locally.
- Keep scripts idempotent where possible; document required environment variables or AWS credentials in a top-of-file comment.
- Prefer Drizzle migrations for production data changes; reserve these helpers for break-glass or investigation workflows.
- If a script becomes part of regular deployment, promote it to a dedicated CLI under `deployment-scripts/` and update docs.

