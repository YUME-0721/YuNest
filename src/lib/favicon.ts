/**
 * favicon.ts — 统一图标代理工具
 *
 * 设计原则：
 * - 所有自动抓取的图标均通过后端代理 /api/icon-proxy 获取
 * - 代理内部按优先级依次尝试 Google / DuckDuckGo / favicon.im / 直连 /favicon.ico
 * - 已知会被墙的第三方图标 URL（favicon.im、Google S2 等）在渲染前统一转换为代理 URL
 * - 用户手动填写的真实图片 URL 保持不变，onError 时降级到代理
 */

/** 已知在部分网络环境下无法访问的图标服务域名 */
const BLOCKED_FAVICON_HOSTS = new Set([
  'favicon.im',
  't3.gstatic.com',
  't2.gstatic.com',
  'www.google.com',
  's2.googleusercontent.com',
  'icons.duckduckgo.com',
]);

/**
 * 根据站点 URL 生成代理图标地址
 * 存储和渲染统一使用此格式：/api/icon-proxy?host=<hostname>
 */
export function getFaviconProxyUrl(siteUrl: string): string {
  try {
    const hostname = new URL(siteUrl).hostname;
    if (!hostname) return '';
    return `/api/icon-proxy?host=${encodeURIComponent(hostname)}`;
  } catch {
    return '';
  }
}

/**
 * 将任意图标 URL 规范化：
 * - 已知被墙服务的 URL → 转换为代理 URL
 * - 普通外链图片 URL → 保持不变（由前端 onError 时降级）
 * - 已经是代理 URL（/api/icon-proxy...）→ 直接返回
 */
export function normalizeIconUrl(url: string): string {
  if (!url) return url;
  // 已经是本站代理 URL，直接返回
  if (url.startsWith('/api/icon-proxy')) return url;

  try {
    const parsed = new URL(url);
    if (BLOCKED_FAVICON_HOSTS.has(parsed.hostname)) {
      // favicon.im/example.com → 取 pathname 中的目标域名
      const targetHost =
        parsed.hostname === 'favicon.im'
          ? parsed.pathname.replace(/^\//, '')
          : parsed.searchParams.get('domain') ||
            parsed.searchParams.get('url') ||
            '';
      if (targetHost) {
        return `/api/icon-proxy?host=${encodeURIComponent(targetHost)}`;
      }
      // 无法提取目标域名，将整个 URL 作为代理目标
      return `/api/icon-proxy?url=${encodeURIComponent(url)}`;
    }
  } catch {
    // url 格式不合法，原样返回
  }
  return url;
}

/**
 * 检测图片是否为 1×1 透明 PNG（代理在所有来源均失败时的兜底响应）
 * 前端通过此函数判断并显示 Globe 图标替代
 */
export function isTransparentPlaceholder(img: HTMLImageElement): boolean {
  return img.naturalWidth <= 1 && img.naturalHeight <= 1;
}
