import { visualizer } from "rollup-plugin-visualizer";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }: { mode: string }) => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Bundle analyzer - only enabled in analyze mode
      mode === "analyze"
        ? visualizer({
            filename: "dist/bundle-stats.html",
            open: true,
            gzipSize: true,
            brotliSize: true,
          })
        : null,
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": "http://localhost:8000",
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            radix: ["radix-ui"],
            gnomad: [
              "@gnomad/region-viewer",
              "@gnomad/track-genes",
              "@gnomad/track-variants",
            ],
          },
        },
      },
    },
  };
});
