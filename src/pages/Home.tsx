/**
 * YuNest 前台首页
 * NOTE: 核心导航展示界面，包含壁纸背景、实时时钟、搜索和书签卡片
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useData, PRESET_SEARCH_ENGINES } from '../context/DataContext.tsx';
import { Search, Settings as SettingsIcon, ExternalLink, Lock, CheckCircle2, AlertCircle, X, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations.ts';

/**
 * 根据域名自动获取 favicon
 * NOTE: 使用 Google Favicon API 作为备选方案
 */
function getFaviconUrl(siteUrl: string): string {
  try {
    const url = new URL(siteUrl);
    // 切换至境内外访问更稳定的图标抓取服务，解决 Google S2 壁垒问题
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
  } catch {
    return '';
  }
}

/** 实时时钟 Hook */
function useClock(timezoneID?: string, language: 'zh-CN' | 'en-US' = 'zh-CN') {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatWithFallback = (options: Intl.DateTimeFormatOptions) => {
    try {
      return new Intl.DateTimeFormat(language, options).format(now);
    } catch (e) {
      // 如果时区无效，fallback 到北京时间
      return new Intl.DateTimeFormat(language, { ...options, timeZone: 'Asia/Shanghai' }).format(now);
    }
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: timezoneID || undefined
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: timezoneID || undefined
  };

  return { 
    time: formatWithFallback(timeOptions), 
    date: formatWithFallback(dateOptions) 
  };
}

export default function Home() {
  const { state } = useData();
  const { settings, categories } = state;
  const t = TRANSLATIONS[settings.language || 'zh-CN'];
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // 认证相关
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(false);

  // 根据设置的 searchEngine 获取可用引擎列表（如果有自定义，动态添加）
  const availableEngines = useMemo(() => {
    const hasCustom = !PRESET_SEARCH_ENGINES.some(e => e.url === settings.searchEngine);
    if (hasCustom && settings.searchEngine) {
      let iconUrl = '';
      try {
        const urlObj = new URL(settings.searchEngine);
        iconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
      } catch (e) {
        // Fallback icon handled in render
      }
      return [
        {
          id: 'custom',
          name: t.searchEngineOther || '自定义',
          url: settings.searchEngine,
          icon: iconUrl
        },
        ...PRESET_SEARCH_ENGINES
      ];
    }
    return PRESET_SEARCH_ENGINES;
  }, [settings.searchEngine, t.searchEngineOther]);

  // 根据当前引擎列表匹配索引
  const [engineIndex, setEngineIndex] = useState(() => {
    const idx = availableEngines.findIndex(e => e.url === settings.searchEngine);
    return idx === -1 ? 0 : idx;
  });
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('yunest_auth') === 'true');
  
  // 背景加载相关
  const [isBgLoaded, setIsBgLoaded] = useState(false);
  
  // 右键菜单相关
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, bookmark: any } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, bookmark: any) => {
    // 只有在定义了内网地址时才显示自定义右键菜单
    if (bookmark.lanUrl) {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, bookmark });
    }
  };

  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    window.addEventListener('scroll', handleCloseMenu);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('scroll', handleCloseMenu);
    };
  }, []);

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

  // 监听设置变化，动态更新全局 CSS 变量（玻璃拟态强度）
  useEffect(() => {
    const root = document.documentElement;
    // 基础模糊值从 0 到 40px
    const blurValue = (settings.glassEffectOpacity / 100) * 40;
    // 背景透明度从 0.1 到 0.8
    const opacityValue = 0.1 + (settings.glassEffectOpacity / 100) * 0.7;
    
    root.style.setProperty('--glass-blur', `${blurValue}px`);
    root.style.setProperty('--glass-opacity', `${opacityValue}`);
  }, [settings.glassEffectOpacity]);

  // 将 settings.timezone 传入 useClock
  const { time, date } = useClock(settings.timezone, settings.language);

  // 保证 engineIndex 不越界
  const safeEngineIndex = engineIndex >= availableEngines.length ? 0 : engineIndex;
  const currentEngine = availableEngines[safeEngineIndex];

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

  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return categories.filter(c => c.bookmarks.length > 0).filter(c => !c.isHidden || isAdmin);

    return categories
      .map(cat => ({
        ...cat,
        bookmarks: cat.bookmarks.filter(b => 
          b.title.toLowerCase().includes(query) || 
          b.url.toLowerCase().includes(query) || 
          (b.description && b.description.toLowerCase().includes(query))
        )
      }))
      .filter(c => c.bookmarks.length > 0)
      .filter(c => !c.isHidden || isAdmin);
  }, [categories, searchQuery, isAdmin]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      window.open(`${currentEngine.url}${encodeURIComponent(searchQuery)}`, '_blank');
      setSearchQuery('');
    }
  };

  const toggleEngine = () => {
    setEngineIndex((prev) => (prev + 1) % availableEngines.length);
  };

  const handleAdminAuth = (e?: React.FormEvent) => {
    e?.preventDefault();
    // 获取环境变量密码，未配置时默认为 "123456"
    const adminPass = (import.meta as any).env.VITE_ADMIN_PASSWORD || '123456';
    
    if (password === adminPass) {
      sessionStorage.setItem('yunest_auth', 'true');
      setShowAuthModal(false);
      setIsAdmin(true);
      setPassword(''); // 清空密码以防下次打开还显示
      if (settings.authRedirect) {
        navigate('/admin/settings');
      }
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
    // 1. URL 图片 (支持 http/https 开头)
    if (iconName && (iconName.startsWith('http://') || iconName.startsWith('https://'))) {
      return (
        <img
          src={iconName}
          alt="icon"
          className={`${size} object-contain`}
          loading="lazy"
          onError={(e) => {
            // 加载失败时尝试 favicon (如果有 siteUrl)
            if (siteUrl) {
              (e.target as HTMLImageElement).src = getFaviconUrl(siteUrl);
            } else {
              // 分类图标加载失败，显示兜底图标
              (e.target as HTMLImageElement).style.display = 'none';
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
        
        {/* 加载占位层：展示一个美观的渐变，避免黑屏 */}
        {settings.wallpaperType !== 'color' && !isBgLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c2c] via-[#4a192c] to-[#121212] animate-pulse opacity-40" />
        )}

        {settings.wallpaperType !== 'color' && (
          <img
            src={bgUrl}
            alt="Background"
            onLoad={() => setIsBgLoaded(true)}
            className={`w-full h-full object-cover animate-bg-drift transition-opacity duration-1000 ${
              isBgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== 'https://pic.yumekai.top/pic?img=ua') {
                target.src = 'https://pic.yumekai.top/pic?img=ua';
              }
            }}
          />
        )}
        {settings.darkMask && (
          <div 
            className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none transition-opacity duration-500" 
            style={{ opacity: settings.darkMaskOpacity / 100 }}
          />
        )}
        {settings.glassEffect && (
          <div 
            className="absolute inset-0 pointer-events-none transition-all duration-500" 
            style={{ 
              backdropFilter: `blur(${(settings.glassEffectOpacity / 100) * 12}px)`,
              WebkitBackdropFilter: `blur(${(settings.glassEffectOpacity / 100) * 12}px)`,
              backgroundColor: `rgba(0, 0, 0, ${ (settings.glassEffectOpacity / 100) * 0.08 })`
            }}
          />
        )}
      </div>

      {/* 左上角网站标题 - 仅在桌面端显示 */}
      <div 
        className={`fixed top-6 left-8 z-50 transition-all duration-500 ease-in-out hidden sm:block ${
          isScrolled ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        <h1 className="text-lg font-medium tracking-[0.15em] text-white/60 uppercase">
          {settings.siteName}
        </h1>
      </div>

      {/* 右上角设置按钮 */}
      <div 
        className={`fixed top-6 right-6 z-50 transition-all duration-500 ease-in-out ${
          isScrolled ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        <button
          onClick={openAuth}
          className="p-3 rounded-2xl glass text-white/40 hover:text-white/90 transition-all duration-300 hover:bg-white/10 group flex items-center justify-center border-0 cursor-pointer"
          title={t.settingsIcon}
        >
          <SettingsIcon className="w-5 h-5 transition-transform duration-500 group-hover:rotate-90" />
        </button>
      </div>

      {/* 主内容区域 */}
      <main className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 sm:px-6">

        {/* 时钟和日期 */}
        <header className="text-center pt-12 sm:pt-16 mb-10 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* 移动端显示的标题 */}
          <h1 className="sm:hidden text-xs font-bold tracking-[0.4em] text-white/40 uppercase mb-4">
            {settings.siteName}
          </h1>
          <div className="text-5xl sm:text-6xl font-extralight tracking-tight text-white/90 mb-2 tabular-nums">
            {time}
          </div>
          <div className="flex items-center justify-center gap-2">
            <p className="text-white/40 text-sm tracking-widest">{date}</p>
            {settings.timezone && (
              <span className="flex items-center gap-1.5 ml-1 text-white/40 text-sm tracking-widest uppercase">
                <span className="opacity-50">/</span>
                {(() => {
                  if (settings.timezone.includes('Asia')) return <Icons.Compass className="w-3.5 h-3.5" />;
                  if (settings.timezone.includes('Europe')) return <Icons.Map className="w-3.5 h-3.5" />;
                  if (settings.timezone.includes('America')) return <Icons.MapPin className="w-3.5 h-3.5" />;
                  if (settings.timezone.includes('Australia')) return <Icons.Navigation className="w-3.5 h-3.5" />;
                  if (settings.timezone.includes('Africa')) return <Icons.Sun className="w-3.5 h-3.5" />;
                  return <Icons.Globe className="w-3.5 h-3.5" />;
                })()}
                <span className="text-[11px] font-medium tracking-[0.2em]">
                  {settings.timezone.split('/').pop()?.replace('_', ' ')}
                </span>
              </span>
            )}
          </div>
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
              placeholder={t.searchPlaceholder.replace('{engine}', currentEngine.name)}
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
          {filteredCategories.map((category, catIndex) => (
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
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-x-1 sm:gap-x-2 gap-y-5 px-1">
                  {category.bookmarks.map((bookmark) => (
                    <a
                      key={bookmark.id}
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onContextMenu={(e) => handleContextMenu(e, bookmark)}
                      className="flex flex-col items-center group w-full"
                    >
                      <div className="w-16 h-16 rounded-2xl glass mb-2 flex items-center justify-center group-hover:bg-white/10 group-hover:-translate-y-1 group-hover:border-white/20 transition-all duration-300">
                        {renderIcon(bookmark.icon, bookmark.url, 'w-8 h-8')}
                      </div>
                      <span className="text-[13px] font-medium text-white/50 group-hover:text-white transition-colors duration-300 text-center truncate w-full px-1">
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
                      onContextMenu={(e) => handleContextMenu(e, bookmark)}
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
          <p className="text-white/20 text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase transition-colors duration-500 hover:text-white/50 cursor-default">
            {t.builtBy}
          </p>
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
                <h3 className="text-xl font-bold text-white mb-2">{t.adminAuthTitle}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{t.adminAuthDesc}</p>
              </div>

              <form onSubmit={handleAdminAuth} className="w-full space-y-4">
                <div className="relative group">
                  <input
                    autoFocus
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t.adminAuthInput}
                    className={`w-full py-4 pl-6 pr-14 glass rounded-2xl outline-none text-center text-lg tracking-[0.3em] font-bold transition-all duration-300 border ${
                      authError ? 'border-red-500/50 text-red-100 bg-red-500/10 animate-shake' : 'border-white/5 focus:border-white/20 text-white'
                    }`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (authError) setAuthError(false);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-white/80 transition-all p-2 bg-white/5 rounded-xl hover:bg-white/10"
                  >
                    {showPassword ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}
                  </button>
                  {authError && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-bold tracking-widest text-red-400/90 uppercase animate-fade-in">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      {t.authFailed}
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-white/90 active:scale-95 transition-all shadow-xl shadow-white/5"
                >
                  {t.adminAuthSubmit}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 右键菜单 */}
      {contextMenu && (
        <div 
          className="fixed z-[200] w-48 glass-strong rounded-2xl p-1.5 shadow-2xl border border-white/10 animate-fade-in origin-top-left"
          style={{ 
            left: Math.min(contextMenu.x, window.innerWidth - 200), 
            top: Math.min(contextMenu.y, window.innerHeight - 120) 
          }}
          onClick={(e) => e.stopPropagation()}
        >
            <div className="px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest border-b border-white/5 mb-1">
              {t.openMethod}
            </div>
            <button
              onClick={() => {
                window.open(contextMenu.bookmark.url, '_blank');
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Icons.Globe className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-none mb-1">{t.defaultUrl}</div>
                <div className="text-[10px] text-white/30 truncate w-24">{t.defaultUrlDesc}</div>
              </div>
            </button>
            
            <button
              onClick={() => {
                window.open(contextMenu.bookmark.lanUrl, '_blank');
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all group mt-1"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Icons.Network className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-none mb-1">{t.lanUrl}</div>
                <div className="text-[10px] text-white/30 truncate w-24">{t.lanUrlDesc}</div>
              </div>
            </button>
        </div>
      )}
    </div>
  );
}
