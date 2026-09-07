/**
 * Cloudflare Pages Function – 图标代理服务
 * 路由: /api/icon-proxy?url=<encoded-favicon-url>
 *
 * 特点：
 * - 使用 Cloudflare Cache API 缓存，避免重复外部请求
 * - 不依赖任何 Node.js / npm 包（兼容 Workers 运行时）
 * - 按优先级依次尝试多个图标服务作为数据源
 * - 失败时返回 1x1 透明 PNG（前端可据此判断并展示兜底 SVG）
 */

// 1x1 透明 PNG base64，用于失败兜底避免 404 产生大量错误日志
const TRANSPARENT_PNG = new Uint8Array([
  137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,
  0,0,0,1,0,0,0,1,8,6,0,0,0,31,21,196,137,
  0,0,0,10,73,68,65,84,120,156,98,0,1,0,0,5,0,
  1,13,10,45,180,0,0,0,0,73,69,78,68,174,66,96,130
]);

/** 按优先级排列的 favicon 获取服务 */
function buildFaviconUrls(hostname: string): string[] {
  return [
    // Google Favicon API (稳定，全球 CDN，支持大尺寸)
    `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${hostname}&size=64`,
    // DuckDuckGo Icons (无需 Google 访问权限)
    `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
    // favicon.im (原有方案)
    `https://favicon.im/${hostname}`,
    // 直接访问站点 /favicon.ico
    `https://${hostname}/favicon.ico`,
  ];
}

/** 尝试依次从候选 URL 获取图标，返回成功的 Response */
async function fetchFirstSuccess(urls: string[]): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s 超时
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; YuNest-IconProxy/1.0)' },
      });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const contentType = res.headers.get('content-type') || 'image/png';
      // 过滤掉 HTML 响应（有些站点返回 200 + HTML 错误页）
      if (contentType.includes('text/html')) continue;
      const data = await res.arrayBuffer();
      if (data.byteLength < 50) continue; // 过滤掉空/极小的响应
      return { data, contentType };
    } catch {
      // 继续下一个
    }
  }
  return null;
}

/** Cloudflare Pages Functions context 类型 */
interface CFContext {
  request: Request;
  waitUntil?: (promise: Promise<unknown>) => void;
}

export async function onRequest(context: CFContext) {
  const { request } = context;
  const reqUrl = new URL(request.url);

  // ---- 解析目标参数 ----
  // 支持两种参数形式：
  //   ?url=https%3A%2F%2Ffavicon.im%2Fexample.com  (旧格式，向后兼容)
  //   ?host=example.com                            (新格式，更简洁)
  let hostname = reqUrl.searchParams.get('host') || '';
  if (!hostname) {
    const rawUrl = reqUrl.searchParams.get('url') || '';
    if (!rawUrl) {
      return new Response('Missing url or host parameter', { status: 400 });
    }
    try {
      // 兼容旧格式：从 favicon.im/xxx.com 或 https://xxx.com 中解析 hostname
      const parsed = new URL(rawUrl);
      // favicon.im/hostname.com → pathname = "/hostname.com"
      hostname = parsed.hostname === 'favicon.im'
        ? parsed.pathname.replace(/^\//, '')
        : parsed.hostname;
    } catch {
      return new Response('Invalid url parameter', { status: 400 });
    }
  }

  if (!hostname) {
    return new Response('Could not determine hostname', { status: 400 });
  }

  // ---- 使用 Cloudflare Cache API ----
  const cacheKey = new Request(`https://icon-cache.internal/${hostname}`, request);
  const cache = (caches as any).default;

  // 优先读缓存
  const cached: Response | undefined = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  // ---- 按优先级依次尝试各图标服务 ----
  const urls = buildFaviconUrls(hostname);
  const result = await fetchFirstSuccess(urls);

  let response: Response;
  if (result) {
    response = new Response(result.data, {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 缓存 24 小时
        'Access-Control-Allow-Origin': '*',
        'X-Icon-Source': 'proxy',
      },
    });
  } else {
    // 所有服务都失败：返回透明 PNG，前端通过 onError 事件展示兜底 SVG
    // 注意：返回 200 而非 404，避免触发额外的错误日志和重试
    response = new Response(TRANSPARENT_PNG, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300', // 失败结果短期缓存 5 分钟
        'Access-Control-Allow-Origin': '*',
        'X-Icon-Source': 'fallback',
      },
    });
  }

  // 写入 Cloudflare Edge Cache（异步，不阻塞响应）
  if (context.waitUntil) {
    context.waitUntil(cache.put(cacheKey, response.clone()));
  } else {
    // 本地开发环境 waitUntil 不存在，直接写入
    try { cache.put(cacheKey, response.clone()); } catch { /* ignore */ }
  }

  return response;
}
