import react from "@vitejs/plugin-react";
import preserveDirectives from "rollup-plugin-preserve-directives";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: { entry: "src/index.ts", formats: ["es"] },
    target: "es2022",
    minify: false,
    rollupOptions: {
      external: [
        /^react($|\/)/,
        /^react-dom($|\/)/,
        /^react-tweet($|\/)/,
        /^shiki($|\/)/,
        /^katex($|\/)/,
      ],
      // One file per module keeps "use client" on the client component only
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
      },
      plugins: [preserveDirectives()],
    },
  },
  test: {
    environment: "happy-dom",
  },
});
