import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  plugins: [
    react(),
    // 手表/老 WebView 不支持 ES module（连请求都不发）→ 出 nomodule SystemJS 回退包 + polyfills
    legacy({
      targets: ["chrome 49"],
      modernTargets: ["chrome 107"],
      renderLegacyChunks: true,
      polyfills: true,
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 5180,
  },
});
