/**
 * FaviconImg.tsx — 高性能图标加载组件
 *
 * 解决图标加载慢的核心问题：
 * 1. 全局并发队列：限制同时发起的代理请求数（默认 12），
 *    避免浏览器因连接数限制导致大量请求排队等待
 * 2. 优先级：可见区域内的图标优先加载（配合 IntersectionObserver）
 * 3. 本地缓存：已成功加载的 URL 缓存到 sessionStorage，页面刷新后秒显
 * 4. 透明 PNG 检测：代理失败时静默显示兜底图标
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Globe } from 'lucide-react';
import { isTransparentPlaceholder } from '../lib/favicon';

// ---------- 全局并发队列 ----------

const MAX_CONCURRENT = 12; // 同时最多发起 N 个图标请求
let activeCount = 0;
const queue: Array<() => void> = [];

function enqueue(task: () => void) {
  if (activeCount < MAX_CONCURRENT) {
    activeCount++;
    task();
  } else {
    queue.push(task);
  }
}

function dequeue() {
  if (queue.length > 0 && activeCount < MAX_CONCURRENT) {
    const next = queue.shift()!;
    next();
  } else {
    activeCount = Math.max(0, activeCount - 1);
  }
}

// ---------- 内存缓存（跨组件共享，页面生命周期内有效）----------

const successCache = new Set<string>();
const failureCache = new Set<string>();

// 从 sessionStorage 恢复已缓存的成功 URL（跨刷新持久化）
try {
  const stored = sessionStorage.getItem('yunest_icon_cache');
  if (stored) {
    JSON.parse(stored).forEach((url: string) => successCache.add(url));
  }
} catch { /* ignore */ }

function persistCache() {
  try {
    sessionStorage.setItem('yunest_icon_cache', JSON.stringify([...successCache].slice(-200)));
  } catch { /* ignore */ }
}

// ---------- 组件 ----------

interface FaviconImgProps {
  src: string;                     // 规范化后的 URL（代理 URL 或真实图片 URL）
  fallbackSrc?: string;            // onError 时的降级代理 URL
  alt?: string;
  className?: string;
  fallbackClassName?: string;      // 兜底 Globe 图标的 className
}

/**
 * 高性能 Favicon 图片组件
 * - 通过并发队列控制加载速率，避免 N 个图标同时请求导致排队
 * - 利用内存+sessionStorage 双层缓存，已加载过的图标瞬间显示
 */
export const FaviconImg: React.FC<FaviconImgProps> = ({
  src,
  fallbackSrc,
  alt = '',
  className = 'w-5 h-5 object-contain rounded-sm',
  fallbackClassName,
}) => {
  // 已在缓存中：直接显示成功状态
  const alreadyCached = successCache.has(src) || (fallbackSrc ? successCache.has(fallbackSrc) : false);
  const alreadyFailed = failureCache.has(src) && (!fallbackSrc || failureCache.has(fallbackSrc));

  const [state, setState] = useState<'pending' | 'loading' | 'success' | 'failed'>(
    alreadyCached ? 'success' : alreadyFailed ? 'failed' : 'pending'
  );
  const [activeSrc, setActiveSrc] = useState(
    alreadyCached
      ? (successCache.has(src) ? src : fallbackSrc || src)
      : src
  );
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  const startLoading = useCallback(() => {
    if (state !== 'pending') return;
    setState('loading');
    enqueue(() => {
      // 已在别处被解决，跳过
      if (successCache.has(src) || successCache.has(fallbackSrc || '')) {
        dequeue();
        return;
      }
      // 触发 img 加载（改变 activeSrc 会触发 re-render，让 img.src 设置）
      setActiveSrc(src);
    });
  }, [state, src, fallbackSrc]);

  // IntersectionObserver：进入可视区域才开始加载
  useEffect(() => {
    if (state !== 'pending') return;

    // 已缓存或已知失败，不需要 observer
    if (alreadyCached || alreadyFailed) return;

    const el = containerRef.current;
    if (!el) return;

    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            observerRef.current?.disconnect();
            startLoading();
          }
        },
        { rootMargin: '200px' } // 提前 200px 开始加载（预加载即将出现的图标）
      );
      observerRef.current.observe(el);
    } else {
      // 不支持 IO 的环境直接加载
      startLoading();
    }

    return () => observerRef.current?.disconnect();
  }, [state, alreadyCached, alreadyFailed, startLoading]);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    if (isTransparentPlaceholder(img)) {
      // 代理返回透明 PNG = 全部来源失败
      if (fallbackSrc && !failureCache.has(src)) {
        failureCache.add(src);
        setActiveSrc(fallbackSrc);
        return;
      }
      failureCache.add(activeSrc);
      setState('failed');
    } else {
      successCache.add(activeSrc);
      persistCache();
      setState('success');
    }
    dequeue();
  }, [activeSrc, src, fallbackSrc]);

  const handleError = useCallback(() => {
    if (fallbackSrc && activeSrc !== fallbackSrc && !failureCache.has(src)) {
      failureCache.add(src);
      setActiveSrc(fallbackSrc);
      return;
    }
    failureCache.add(activeSrc);
    setState('failed');
    dequeue();
  }, [activeSrc, src, fallbackSrc]);

  const globeClass = fallbackClassName || className.replace(/object-contain|rounded-sm/g, '').trim();

  return (
    <span ref={containerRef} className={`inline-flex items-center justify-center ${state === 'failed' ? '' : ''}`} style={{ width: 'auto', height: 'auto' }}>
      {state === 'failed' ? (
        <Globe className={`${globeClass} text-white/50`} />
      ) : (
        <img
          ref={imgRef}
          src={state === 'pending' ? undefined : activeSrc}
          alt={alt}
          className={`${className} ${state === 'success' ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          style={{ display: state === 'failed' ? 'none' : undefined }}
        />
      )}
    </span>
  );
};
