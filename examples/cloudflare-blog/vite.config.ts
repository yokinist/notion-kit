import { cloudflare } from "@cloudflare/vite-plugin";
import { unstable_reactRouterRSC as reactRouterRSC } from "@react-router/dev/vite";
import rsc from "@vitejs/plugin-rsc";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    // The Worker runs the RSC environment, which calls the SSR one
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
    }),
    // React Router's plugin must come before the RSC one
    reactRouterRSC(),
    rsc(),
  ],
  resolve: { tsconfigPaths: true },
});
