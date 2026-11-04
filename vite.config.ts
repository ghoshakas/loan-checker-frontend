import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Backend URL is configured via VITE_BACKEND_URL (see .env.example).
//  - Dev (`npm run dev`): the frontend calls the relative path /api, and this
//    dev server proxies /api -> VITE_BACKEND_URL (no CORS needed).
//  - Production build: the frontend calls VITE_BACKEND_URL directly
//    (see src/api.ts); the backend must allow the frontend origin via CORS.
export default defineConfig(({ mode }) => {
  // "." = the frontend folder (where .env lives); avoids needing @types/node.
  const env = loadEnv(mode, ".", "VITE_");
  if (!env.VITE_BACKEND_URL) {
    throw new Error(
      "VITE_BACKEND_URL is not set. Add it to frontend/.env " +
        "(e.g. VITE_BACKEND_URL=http://127.0.0.1:8000) — see .env.example."
    );
  }
  const backendUrl = env.VITE_BACKEND_URL.replace(/\/+$/, "");

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
