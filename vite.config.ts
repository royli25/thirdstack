import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { execFileSync } from "node:child_process";
export default defineConfig(() => {
  const port = Number(process.env.PORT || 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("Invalid PORT for the local API proxy.");
  return {
    // Application settings arrive from the explicit launcher, never shared .env files.
    envDir: false,
    // The development app and browser fixtures may run from this checkout together.
    cacheDir: `node_modules/.vite/api-${port}`,
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "two-hands-development-source",
        apply: "serve",
        configureServer(server) {
          const branch = execFileSync("git", ["branch", "--show-current"], {
            cwd: server.config.root,
            encoding: "utf8",
          }).trim();
          server.config.logger.info(
            `[Two Hands] ${server.config.root} (${branch || "detached HEAD"})`,
          );
        },
      },
    ],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: {
      port: 5175,
      strictPort: true,
      proxy: {
        "/.well-known/oauth-protected-resource": {
          target: `http://127.0.0.1:${port}`,
          changeOrigin: false,
        },
        "/mcp": {
          target: `http://127.0.0.1:${port}`,
          changeOrigin: false,
          timeout: 150_000,
          proxyTimeout: 150_000,
        },
        "/api": {
          target: `http://127.0.0.1:${port}`,
          // Keep the browser's host so API write checks match production.
          changeOrigin: false,
        },
      },
    },
    test: { include: ["tests/**/*.test.ts"] },
  };
});
