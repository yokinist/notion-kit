import { unstable_reactRouterRSC as reactRouterRSC } from "@react-router/dev/vite";
import rsc from "@vitejs/plugin-rsc";
import { defineConfig } from "vite";

export default defineConfig({
  // React Router's plugin must come before the RSC one
  plugins: [reactRouterRSC(), rsc()],
  resolve: { tsconfigPaths: true },
});
