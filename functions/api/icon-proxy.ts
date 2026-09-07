/**
 * Cloudflare Pages Function – 图标代理服务
 * 路由: /api/icon-proxy?host=<hostname>  或  ?url=<legacy-favicon-im-url>
 *
 * 优化重点：
 * - 所有 favicon 来源 **并行竞速**（Promise.any），谁快用谁，彻底消除串行等待
 * - 超时从 5s 缩短至 3s，进一步降低延迟上限
 * - 使用 Cloudflare Cache API 缓存 24h，二次加载瞬间响应
 * - 全部失败时返回透明 PNG（而非 404），前端静默降级为 Globe 图标
 */

// 1x1 透明 PNG，用于全部来源失败时的兜底响应
const TRANSPARENT_PNG = new Uint8Array([
  137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,
  0,0,0,1,0,0,0,1,8,6,0,0,0,31,21,196,137,
  0,0,0,10,73,68,65,84,120,156,98,0,1,0,0,5,0,
  1,13,10,45,180,0,0,0,0,73,69,78,68,174,66,96,130
]);

const PROXY_UA = 'Mozilla/5.0 (compatible; YuNest-IconProxy/1.0)';
const FETCH_TIMEOUT_MS = 3000; // 单个来源超时 3s

/** 构建待竞速的 favicon 候选 URL 列表 */
function buildFaviconUrls(hostname: string): string[] {
  return [
    // Google Favicon API（质量最高，Edge 节点分布广）
    `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${hostname}&size=64`,
    // DuckDuckGo（无需 Google 访问权限，覆盖率高）
    `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
    // favicon.im（第三方聚合服务）
    `https://favicon.im/${hostname}`,
    // 直接访问站点根 favicon
    `https://${hostname}/favicon.ico`,
  ];
}

/**
 * 带超时的单次 fetch，返回有效图标数据；
 * 若失败（网络错误、非 200、HTML 响应、空文件）则 reject
 */
async function fetchOneIcon(url: string): Promise<{ data: ArrayBuffer; contentType: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': PROXY_UA },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get('content-type') || 'image/png';
    if (contentType.includes('text/html')) throw new Error('HTML response');
    const data = await res.arrayBuffer();
    if (data.byteLength < 50) throw new Error('Too small');
    return { data, contentType };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * 并行竞速所有候选 URL，取第一个成功的结果。
 * 相比顺序尝试（最坏 4×3s=12s），并行后最坏仅 3s。
 */
async function fetchIconParallel(urls: string[]): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  try {
    return await Promise.any(urls.map(fetchOneIcon));
  } catch {
    // AggregateError：所有候选均失败
    return null;
  }
}

/** Cloudflare Pages Functions context 类型 */
interface CFContext {
  request: Request;
  waitUntil?: (promise: Promise<unknown>) => void;
}

export async function onRequest(context: CFContext) {
  const { request } = context;
  const reqUrl = new URL(request.url);

  // 解析目标 hostname
  // 新格式：?host=example.com
  // 旧格式：?url=https%3A%2F%2Ffavicon.im%2Fexample.com（向后兼容）
  let hostname = reqUrl.searchParams.get('host') || '';
  if (!hostname) {
    const rawUrl = reqUrl.searchParams.get('url') || '';
    if (!rawUrl) {
      return new Response('Missing url or host parameter', { status: 400 });
    }
    try {
      const parsed = new URL(rawUrl);
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

  // 读 Cloudflare Edge Cache（命中则直接返回，延迟 <10ms）
  const cache = (caches as any).default;
  const cacheKey = new Request(`https://icon-cache.internal/v2/${hostname}`, request);
  const cached: Response | undefined = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  // 并行竞速所有图标来源
  const result = await fetchIconParallel(buildFaviconUrls(hostname));

  let response: Response;
  if (result) {
    response = new Response(result.data, {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Edge + 浏览器各缓存 24h
        'Access-Control-Allow-Origin': '*',
        'Vary': 'Accept-Encoding',
      },
    });
  } else {
    // 全部来源失败，返回透明 PNG（前端通过 isTransparentPlaceholder 检测并显示 Globe）
    response = new Response(TRANSPARENT_PNG, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300', // 失败结果缓存 5min，避免频繁重试
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // 异步写入 Edge Cache，不阻塞当前响应
  const putPromise = cache.put(cacheKey, response.clone());
  if (context.waitUntil) {
    context.waitUntil(putPromise);
  } else {
    putPromise.catch(() => { /* 本地开发环境忽略 */ });
  }

  return response;
}
