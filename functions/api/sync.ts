/**
 * Cloudflare Pages & 腾讯云 EdgeOne Pages 边缘函数入口
 * 路径：/api/sync
 */

import { handleSyncRequest } from '../../server/syncCore.ts';

export const onRequest: PagesFunction = async (context) => {
  return handleSyncRequest(context.request, context.env as any);
};
