import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4001",
        changeOrigin: true,
      },
    },
  },
  build: {
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          "react-vendor": ["react", "react-dom"],
          codemirror: [
            "@codemirror/lang-css",
            "@codemirror/lang-html",
            "@codemirror/lang-javascript",
            "@codemirror/lang-json",
            "@codemirror/lang-markdown",
            "@codemirror/lang-sql",
            "@codemirror/theme-one-dark",
            "@uiw/react-codemirror",
          ],
        },
      },
    },
    // Increase chunk size warning limit since we have code editor dependencies
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging
    sourcemap: true,
    // Optimize assets
    assetsInlineLimit: 4096,
  },
  optimizeDeps: {
    // Pre-bundle dependencies for faster dev server startup
    include: [
      "react",
      "react-dom",
      "@codemirror/lang-css",
      "@codemirror/lang-html",
      "@codemirror/lang-javascript",
      "@codemirror/lang-json",
      "@codemirror/lang-markdown",
      "@codemirror/lang-sql",
      "@codemirror/theme-one-dark",
      "@uiw/react-codemirror",
    ],
  },
  // Enable CSS code splitting
  css: {
    devSourcemap: true,
  },
});

