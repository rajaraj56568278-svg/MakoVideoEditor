import { defineConfig } from "vite";
import { existsSync, readdirSync } from "node:fs";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { makoData } from "@makoai/app-sdk/vite";

const bindingsDir = new URL("./bindings", import.meta.url);

export default defineConfig({
  plugins: [react(), tailwindcss(), makoData()],
  define: {
    __APP_BINDING_NAMES__: JSON.stringify(
      existsSync(bindingsDir)
        ? readdirSync(bindingsDir)
            .filter(name => name.endsWith(".sql"))
            .map(name => name.slice(0, -4))
        : [],
    ),
  },
  base: "./",
  server: {
    host: true,
    allowedHosts: [".e2b.app"],
  },
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  },
});
