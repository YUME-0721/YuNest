import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
  build: {
    // NOTE: 确保构建产物为纯静态文件，适配 Cloudflare Pages / EdgeOne
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
