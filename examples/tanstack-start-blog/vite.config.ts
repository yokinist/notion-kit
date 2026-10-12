import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  // nitro builds the server for your host; on Vercel it picks the right preset
  plugins: [
    tanstackStart({ rsc: { enabled: true } }),
    rsc(),
    nitro(),
    viteReact(),
  ],
});
