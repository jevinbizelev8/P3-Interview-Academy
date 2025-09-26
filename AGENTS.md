# Repository Guidelines

## Project Structure & Module Organization
The TypeScript monorepo separates the Vite-driven client in `client/src` (UI in `components/`, routed views in `pages/`, hooks in `hooks/`, API wrappers in `services/`) from the Express API in `server/` (`routes.ts`, `services/`, `middleware/`, and the Vite bootstrap in `index.ts`). Shared contracts and Drizzle schemas live in `shared/schema.ts` and `shared/types.ts`; update them alongside corresponding route handlers. Deployment helpers are collected under `deployment-scripts/`, while production bundles output to `dist/`. Large design artifacts and marketing collateral stay in `attached_assets/` - avoid copying them into the runtime folders.

## Build, Test, and Development Commands
- `npm run dev` starts the Express server with Vite middleware on port 5000.
- `npm run build` compiles the client and bundles `server/index.ts` with esbuild into `dist/`.
- `npm start` runs the production bundle exactly as Replit/AWS hosts it.
- `npm run check` type-checks the entire workspace; resolve errors before committing.
- `npm run db:push` applies Drizzle migrations defined in `drizzle.config.ts`; seed locally with `npx tsx server/seed.ts`.
- `npm run test`, `npm run test:run`, and `npm run test:coverage` cover watch, CI, and coverage workflows respectively.

## Coding Style & Naming Conventions
Stick to TypeScript, ES modules, and two-space indentation as seen in `client/src/App.tsx`. Prefer double-quoted imports and maintain consistent JSX prop ordering. Components stay in PascalCase (`AuthenticatedLanding.tsx`), hooks and utilities in camelCase (`useAuth.ts`), and route directories in kebab-case (`pages/prepare`). Use the `@/` alias defined in `tsconfig.json` for client imports; default to relative paths inside `server/`. There is no repo-wide linter, so let the TypeScript checker, Vitest suites, and your editor formatting guard rails enforce style.

## Testing Guidelines
Vitest plus React Testing Library power the suite. Place UI specs under `client/src/__tests__/` mirroring the feature tree (`components/Home.test.tsx`, `integration/session.test.ts`). Server logic should gain colocated tests under `server/**/__tests__`. Mock AI and storage calls with MSW or manual stubs to avoid hitting real services. Target >=80 percent statements using `npm run test:coverage`, and favor explicit assertions over snapshots.

## Commit & Pull Request Guidelines
Follow the existing history: keep subjects short, capitalized, and imperative (`Add deployment configuration`, `Fix GitHub Actions workflow`). Mention the scope (client/server/shared) in the body when relevant. PRs must summarise intent, link issues or Trello tickets, list verification commands, and attach UI screenshots for visual changes. Before requesting review, run `npm run check`, `npm run test:run`, and any affected database scripts, then note the results in the PR description.

## Security & Configuration Tips
Copy `.env.example` to `.env` and provide credentials for OpenAI, SeaLion, and the database only in local or secrets-managed environments. Rotate keys regularly, scrub fixtures of production data, and update `DEPLOYMENT.md` whenever infrastructure prerequisites shift. Never commit generated `.zip` bundles or `.env` files.
