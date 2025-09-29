import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(async () => {
  const { default: runtimeErrorOverlay } = await import(
    "@replit/vite-plugin-runtime-error-modal"
  );

  const plugins = [react(), runtimeErrorOverlay()];

  const shouldEnableCartographer =
    process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined;

  if (shouldEnableCartographer) {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    plugins.push(cartographer());
  }

  const rootDir = path.resolve(import.meta.dirname, "client");
  const distDir = path.resolve(import.meta.dirname, "dist/public");

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: rootDir,
    build: {
      outDir: distDir,
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: path.resolve(rootDir, "src/__tests__/setup.ts"),
      environmentMatchGlobs: [["server/**/*.test.ts", "node"]],
    },
  };
});

