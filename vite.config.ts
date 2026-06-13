import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // ── Production build optimizations ──────────────────────────────────────────
  build: {
    // Raise the inline asset threshold so tiny SVGs / fonts go inline
    assetsInlineLimit: 4096,

    rollupOptions: {
      output: {
        // ── Manual chunk splitting ─────────────────────────────────────────────
        // Groups heavy, stable, rarely-changing dependencies into their own
        // cache-able files. When app code changes, vendor chunks are NOT
        // re-downloaded by returning visitors.
        manualChunks(id) {
          // React core — smallest, most-stable chunk
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "vendor-react";
          }

          // React ecosystem (router, hot-toast)
          if (
            id.includes("node_modules/react-router") ||
            id.includes("node_modules/react-hot-toast")
          ) {
            return "vendor-react-ecosystem";
          }

          // FontAwesome — three packages, quite large
          if (id.includes("node_modules/@fortawesome/")) {
            return "vendor-fontawesome";
          }

          // TipTap rich-text editor — only needed on NewPost + PostDetail + ArticleEditor
          if (id.includes("node_modules/@tiptap/")) {
            return "vendor-tiptap";
          }

          // Supabase client
          if (id.includes("node_modules/@supabase/")) {
            return "vendor-supabase";
          }

          // Lucide icons
          if (id.includes("node_modules/lucide-react/")) {
            return "vendor-lucide";
          }
        },
      },
    },

    // Generate source maps only in CI/staging — omit in production to shrink
    // total deployed asset size. Override via VITE_SOURCEMAP env var if needed.
    sourcemap: process.env.VITE_SOURCEMAP === "true",
  },

  // ── Dependency pre-bundling ──────────────────────────────────────────────────
  // DO NOT exclude lucide-react. Excluding it caused Vite to serve each icon as
  // a raw ESM file with individual HTTP requests in dev — defeating the purpose.
  // With include: Vite pre-bundles lucide into a single CJS-compatible module.
  optimizeDeps: {
    include: ["lucide-react"],
  },
});
