import { fileURLToPath, URL } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  // MapLibre ships its GL worker as a separate ESM chunk. Vite's dependency
  // optimizer rewrites the worker URL but does not emit the file, so the worker
  // 404s, the style never finishes parsing, and the map stays blank with no
  // error. Excluding the package keeps the worker resolvable from source.
  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8787",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "server/**/*.test.ts"],
  },
})
