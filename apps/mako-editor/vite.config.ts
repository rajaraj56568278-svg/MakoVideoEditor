import { defineConfig } from "vite";
import { existsSync, readdirSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { makoData } from "@makoai/app-sdk/vite";

const bindingsDir = new URL("./bindings", import.meta.url);

export default defineConfig({
  // makoData serves this app's data bindings (__data/*.parquet) during a
  // LOCAL `vite dev`, straight from the Mako API — see AGENTS.md → Data.
  // Inside Mako's own sandbox the launcher answers those paths itself and
  // the plugin stays idle.
  plugins: [react(), makoData()],
  // The binding names, for RefreshAllButton (@makoai/app-sdk/ui): a new
  // bindings/<name>.sql is picked up without touching the code.
  define: {
    __APP_BINDING_NAMES__: JSON.stringify(
      existsSync(bindingsDir)
        ? readdirSync(bindingsDir)
            .filter(name => name.endsWith(".sql"))
            .map(name => name.slice(0, -4))
        : [],
    ),
  },
  // Relative asset URLs so builds work under any hosting prefix
  // (including Mako's token-scoped preview paths).
  base: "./",
  server: {
    // The preview reaches the dev server on the sandbox's public origin
    // (<port>-<sandbox>.e2b.app). Without this, a `vite` started from the
    // terminal answers "Blocked request. This host is not allowed."
    host: true,
    allowedHosts: [".e2b.app"],
  },
});
