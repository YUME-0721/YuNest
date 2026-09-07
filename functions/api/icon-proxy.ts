import { LRUCache } from 'lru-cache';

// 缓存最多 100 条记录，TTL 1 小时
const cache = new LRUCache<string, { data: Uint8Array; contentType: string }>({
  max: 100,
  ttl: 1000 * 60 * 60,
});

/**
 * Cloudflare Pages Functions – 代理获取图标并缓存
 * 请求示例: /api/icon-proxy?url=https%3A%2F%2Ffavicon.im%2Fexample.com
 */
export async function onRequest({ request }: { request: Request }) {
  const url = new URL(request.url);
  const target = url.searchParams.get('url');
  if (!target) {
    return new Response('Missing url query parameter', { status: 400 });
  }

  // 从缓存读取
  const cached = cache.get(target);
  if (cached) {
    return new Response(cached.data, {
      status: 200,
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  try {
    const resp = await fetch(target);
    if (!resp.ok) {
      return new Response('Icon not found', { status: 404 });
    }
    const arrayBuffer = await resp.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const contentType = resp.headers.get('Content-Type') || 'image/*';
    cache.set(target, { data, contentType });
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (e) {
    return new Response('Error fetching icon', { status: 500 });
  }
}
