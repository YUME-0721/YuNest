/**
 * Vercel Edge Function 入口
 * 路径：/api/sync
 */

import { handleSyncRequest } from '../server/syncCore.ts';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  // Vercel Edge Functions 将环境变量注入在 process.env 中
  return handleSyncRequest(req, (process.env as any) || {});
}
