import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {

  const isDev = mode === "development";

  return {

    plugins: [
      react(),
      tailwindcss(),
    ],

    // ======================================================
    // DEVELOPMENT
    // ======================================================

    server: isDev
      ? {

          host: true,

          port: 3000,

          strictPort: true,

          // IMPORTANT FOR SUBDOMAINS
          allowedHosts: [
            ".imsmymunc.local",
            ".imsmymunc.localhost",
            ".localhost",
          ],

          // ==================================================
          // API PROXY
          // ==================================================

          proxy: {

            "/api": {

              target: "http://localhost:5000",

              changeOrigin: true,

              secure: false,

              ws: true,
            },

            // ==================================================
            // SOCKET.IO PROXY
            // ==================================================

            "/socket.io": {

              target: "http://localhost:5000",

              ws: true,

              changeOrigin: true,

              secure: false,
            },
          },
        }

      : undefined,

    // ======================================================
    // PREVIEW
    // ======================================================

    preview: {

      host: true,

      port: 3000,
    },
  };
});