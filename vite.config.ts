import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8089,
    // ADD THIS LINE - crucial for client-side routing
    historyApiFallback: true,
    proxy: {
      '/legacy-imaging': {
        target: 'http://10.203.14.169',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/legacy-imaging/, '/imaging')
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));