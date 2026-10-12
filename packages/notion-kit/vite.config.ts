import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    lib: { entry: "src/index.ts", formats: ["es"], fileName: "index" },
    rollupOptions: { external: [/^@notionhq\/client/] },
    target: "es2022",
    minify: false,
  },
  test: {
    environment: "node",
  },
});
