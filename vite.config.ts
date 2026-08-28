import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { handleSyncRequest } from './server/syncCore.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'local-sync-proxy-plugin',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/sync')) {
              try {
                // 将 Node.js IncomingMessage 转为 Web Request
                const protocol = req.headers['x-forwarded-proto'] || 'http';
                const host = req.headers.host || 'localhost:5173';
                const url = new URL(req.url, `${protocol}://${host}`);

                let body: any = null;
                if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
                  const chunks: any[] = [];
                  for await (const chunk of req) {
                    chunks.push(chunk);
                  }
                  body = Buffer.concat(chunks).toString();
                }

                const webReq = new Request(url.toString(), {
                  method: req.method,
                  headers: req.headers as any,
                  body: body ? body : undefined,
                });

                const response = await handleSyncRequest(webReq, {
                  GITHUB_TOKEN: env.GITHUB_TOKEN || env.VITE_GITHUB_TOKEN,
                  GITHUB_REPO: env.GITHUB_REPO || env.VITE_GITHUB_REPO,
                  ADMIN_PASSWORD: env.ADMIN_PASSWORD || env.VITE_ADMIN_PASSWORD || '123456',
                });

                res.statusCode = response.status;
                response.headers.forEach((value, key) => {
                  res.setHeader(key, value);
                });
                const responseData = await response.text();
                res.end(responseData);
                return;
              } catch (e: any) {
                console.error('Local /api/sync middleware error:', e);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: e.message || 'Internal Dev Error' }));
                return;
              }
            }
            next();
          });
        },
      },
    ],
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
      // NOTE: 确保构建产物为纯静态文件，适配 Cloudflare Pages / EdgeOne / Vercel
      outDir: 'dist',
      assetsDir: 'assets',
    },
  };
});

