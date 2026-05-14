// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    build: {
      target: "esnext",
      // Optimize asset handling
      assetsInlineLimit: 4096, // Inline assets < 4kb
      rollupOptions: {
        output: {
          // Manual chunks for better code splitting and caching
          manualChunks: {
            // Core React libraries
            vendor: ["react", "react-dom"],
            // Router
            router: ["@tanstack/react-router"],
            // Supabase SDK
            supabase: ["@supabase/supabase-js", "@supabase/auth-helpers-react"],
            // UI libraries
            ui: ["framer-motion", "lucide-react"],
            // Charts (only loaded when needed)
            recharts: ["recharts"],
          },
        },
      },
    },
    // Optimize deps pre-bundling
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "@tanstack/react-router",
        "@supabase/supabase-js",
        "framer-motion",
        "lucide-react",
      ],
    },
  },
});
