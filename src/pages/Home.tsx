/**
 * YuNest 前台首页
 * NOTE: 核心导航展示界面，包含壁纸背景、实时时钟、搜索和书签卡片
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useData, PRESET_SEARCH_ENGINES } from '../context/DataContext.tsx';
import { Search, Settings as SettingsIcon, ExternalLink, Lock, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';

/**
 * 根据域名自动获取 favicon
 * NOTE: 使用 Google Favicon API 作为备选方案
 */
function getFaviconUrl(siteUrl: string): string {
  try {
    const url = new URL(siteUrl);
    return `https://favicon.im/${url.hostname}`;
  } catch {
    return '';
  }
}

/** 实时时钟 Hook */
function useClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return { time, date };
}

export default function Home() {
  const { state } = useData();
  const { settings, categories } = state;
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // 认证相关
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  // 根据设置的 searchEngine 匹配对应的预设引擎索引
  const [engineIndex, setEngineIndex] = useState(() => {
    const idx = PRESET_SEARCH_ENGINES.findIndex(e => e.url === settings.searchEngine);
    return idx === -1 ? 0 : idx;
  });
  
  const [isScrolled, setIsScrolled] = useState(false);
  const isAdmin = useMemo(() => sessionStorage.getItem('yunest_auth') === 'true', []);

  // 监听滚动，控制标题显隐
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { time, date } = useClock();

  const currentEngine = PRESET_SEARCH_ENGINES[engineIndex];

  const bgUrl = useMemo(() => {
    if (settings.wallpaperType === 'local' && settings.localWallpaper) {
      return settings.localWallpaper;
    }
    // 如果没有设置 URL，则使用示例地址作为回退
    const url = settings.wallpaperUrl || 'https://pic.yumekai.top/pic?img=ua';
    if (settings.wallpaperType === 'api') {
      // NOTE: 附加时间戳以强制刷新随机图
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}t=${Date.now()}`;
    }
    return url;
  }, [settings.wallpaperType, settings.wallpaperUrl, settings.localWallpaper]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      window.open(`${currentEngine.url}${encodeURIComponent(searchQuery)}`, '_blank');
      setSearchQuery('');
    }
  };

  const toggleEngine = () => {
    setEngineIndex((prev) => (prev + 1) % PRESET_SEARCH_ENGINES.length);
  };

  const handleAdminAuth = (e?: React.FormEvent) => {
    e?.preventDefault();
    // 获取环境变量密码，未配置时默认为 "123456"
    const adminPass = (import.meta as any).env.VITE_ADMIN_PASSWORD || '123456';
    
    if (password === adminPass) {
      sessionStorage.setItem('yunest_auth', 'true');
      setShowAuthModal(false);
      navigate('/admin/settings');
    } else {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 2000);
    }
  };

  const openAuth = () => {
    if (sessionStorage.getItem('yunest_auth') === 'true') {
      navigate('/admin/settings');
    } else {
      setShowAuthModal(true);
    }
  };

  /**
   * 渲染图标：优先级依次为
   * 1. URL 图片（以 http 开头）
   * 2. Lucide 图标名
   * 3. 根据书签 URL 自动获取 favicon
   * 4. 兜底使用 Globe 图标
   */
  const renderIcon = (iconName: string, siteUrl?: string, size: string = 'w-5 h-5') => {
    // URL 图片
    if (iconName.startsWith('http')) {
      return (
        <img
          src={iconName}
          alt="icon"
          className={`${size} object-contain rounded-sm`}
          loading="lazy"
          onError={(e) => {
            // 加载失败时尝试 favicon
            const target = e.target as HTMLImageElement;
            if (siteUrl) {
              target.src = getFaviconUrl(siteUrl);
            }
          }}
        />
      );
    }

    // Lucide 图标
    const IconComponent = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    if (IconComponent) {
      return <IconComponent className={`${size} text-white/70`} />;
    }

    // 尝试自动获取 favicon
    if (siteUrl) {
      const faviconUrl = getFaviconUrl(siteUrl);
      if (faviconUrl) {
        return (
          <img
            src={faviconUrl}
            alt="icon"
            className={`${size} object-contain rounded-sm`}
            loading="lazy"
            onError={(e) => {
              // 最终兜底
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        );
      }
    }

    // 兜底
    return <Icons.Globe className={`${size} text-white/70`} />;
  };

  return (
    <div className="text-white min-h-screen font-sans selection:bg-white/20 relative overflow-hidden">
      {/* 背景壁纸层 */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-[#0a0a0a]" 
        style={settings.wallpaperType === 'color' ? { backgroundColor: settings.backgroundColor } : {}}>
        {settings.wallpaperType !== 'color' && (
          <img
            src={bgUrl}
            alt="Background"
            className="w-full h-full object-cover opacity-80 animate-bg-fade-in animate-bg-drift"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== 'https://pic.yumekai.top/pic?img=ua') {
                target.src = 'https://pic.yumekai.top/pic?img=ua';
              }
            }}
          />
        )}
        {settings.darkMask && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/70" />
        )}
        {settings.glassEffect && (
          <div className="absolute inset-0 backdrop-blur-[2px]" />
        )}
      </div>

      {/* 左上角网站标题 */}
      <div 
        className={`fixed top-6 left-8 z-50 transition-all duration-500 ease-in-out ${
          isScrolled ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        <h1 className="text-lg font-medium tracking-[0.15em] text-white/60 uppercase">
          {settings.siteName}
        </h1>
      </div>

      {/* 右上角设置按钮 */}
      <div className="fixed top-6 right-6 z-50 animate-fade-in" style={{ animationDelay: '0.8s' }}>
        <button
          onClick={openAuth}
          className="p-3 rounded-2xl glass text-white/40 hover:text-white/90 transition-all duration-300 hover:bg-white/10 group flex items-center justify-center border-0 cursor-pointer"
          title="管理后台"
        >
          <SettingsIcon className="w-5 h-5 transition-transform duration-500 group-hover:rotate-90" />
        </button>
      </div>

      {/* 主内容区域 */}
      <main className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 sm:px-6">

        {/* 时钟和日期 */}
        <header className="text-center pt-12 sm:pt-16 mb-10 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="text-5xl sm:text-6xl font-extralight tracking-tight text-white/90 mb-2 tabular-nums">
            {time}
          </div>
          <p className="text-white/40 text-sm tracking-widest">{date}</p>
        </header>



        {/* 搜索栏 */}
        <section className="w-full max-w-2xl mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className={`relative group search-glow rounded-2xl transition-all duration-500 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
            <div 
              className="absolute inset-y-0 left-0 pl-4 flex items-center cursor-pointer z-20 group/engine"
              onClick={toggleEngine}
              title={`点击切换搜索引擎 (当前: ${currentEngine.name})`}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                <img 
                  src={currentEngine.icon} 
                  alt={currentEngine.name} 
                  className="w-5 h-5 grayscale group-hover/engine:grayscale-0 transition-all"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://www.google.com/favicon.ico';
                  }}
                />
              </div>
            </div>
            <input
              type="text"
              id="search-input"
              className="w-full py-4 pl-14 pr-6 glass rounded-2xl focus:bg-white/10 transition-all duration-300 text-base font-light placeholder:text-white/20 outline-none text-white/90 border-0"
              placeholder={`在 ${currentEngine.name} 中搜索...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </div>
        </section>

        {/* 书签分组 - 改为垂直排列，内部书签横向排列 */}
        <div className="w-full max-w-7xl flex flex-col gap-12 pb-24">
          {categories
            .filter(c => c.bookmarks.length > 0)
            .filter(c => !c.isHidden || isAdmin)
            .map((category, catIndex) => (
            <section
              key={category.id}
              className="animate-fade-in-scale"
              style={{ animationDelay: `${0.4 + catIndex * 0.1}s` }}
            >
              {/* 分组标题 */}
              <h2 className="text-sm font-bold uppercase tracking-[0.25em] text-white/50 px-3 mb-6 flex items-center gap-3">
                {renderIcon(category.icon, undefined, 'w-5 h-5')}
                {category.title}
                <span className="text-white/20 font-medium text-xs">({category.bookmarks.length})</span>
              </h2>

              {/* 书签列表 - 根据分类布局模式渲染 */}
              {category.layout === 'grid' ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-x-4 gap-y-8 px-2">
                  {category.bookmarks.map((bookmark) => (
                    <a
                      key={bookmark.id}
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center group"
                    >
                      <div className="w-14 h-14 rounded-2xl glass mb-3 flex items-center justify-center group-hover:bg-white/10 group-hover:-translate-y-1 group-hover:border-white/20 transition-all duration-300">
                        {renderIcon(bookmark.icon, bookmark.url, 'w-7 h-7')}
                      </div>
                      <span className="text-[11px] font-medium text-white/50 group-hover:text-white transition-colors duration-300 text-center truncate w-full px-1">
                        {bookmark.title}
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {category.bookmarks.map((bookmark) => (
                    <a
                      key={bookmark.id}
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-4 rounded-2xl glass hover:bg-white/10 hover:-translate-y-0.5 hover:border-white/15 transition-all duration-300 group"
                    >
                      <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center mr-4 group-hover:bg-white/10 transition-colors duration-300 shrink-0">
                        {renderIcon(bookmark.icon, bookmark.url)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white group-hover:text-white transition-colors duration-300 truncate">
                          {bookmark.title}
                        </p>
                        {bookmark.description && (
                          <p className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5 truncate">
                            {bookmark.description}
                          </p>
                        )}
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-white/0 group-hover:text-white/30 transition-all duration-300 shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* 页脚 */}
        <footer className="mt-auto py-12 text-center animate-fade-in" style={{ animationDelay: '1.2s' }}>
          <a
            href="https://github.com/YUME-0721/YuNest"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-medium tracking-[0.35em] uppercase text-white/20 hover:text-white/60 transition-all duration-500 hover:tracking-[0.45em]"
          >
            Built by YuNest
          </a>
        </footer>
      </main>

      {/* 认证弹窗 */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
          <div className="relative w-full max-w-sm glass-strong rounded-3xl p-8 shadow-2xl animate-fade-in-scale border border-white/10 text-white">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-white/20 hover:text-white/60 transition-colors p-2"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/80 border border-white/10 mb-2">
                <Lock className="w-8 h-8" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-white mb-2">管理认证</h3>
                <p className="text-sm text-white/40 leading-relaxed">进入后台需要验证管理员密码</p>
              </div>

              <form onSubmit={handleAdminAuth} className="w-full space-y-4">
                <div className="relative group">
                  <input
                    autoFocus
                    type="password"
                    placeholder="输入认证密码"
                    className={`w-full py-4 px-6 glass rounded-2xl outline-none text-center text-lg tracking-[0.3em] font-bold transition-all duration-300 border ${
                      authError ? 'border-red-500/50 text-red-100 bg-red-500/10 animate-shake' : 'border-white/5 focus:border-white/20'
                    }`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (authError) setAuthError(false);
                    }}
                  />
                  {authError && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-bold tracking-widest text-red-400/90 uppercase animate-fade-in">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      密码认证失败，请核对后重试
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-white/90 active:scale-95 transition-all shadow-xl shadow-white/5"
                >
                  进入后台
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
