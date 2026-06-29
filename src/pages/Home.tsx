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
import { WidgetRenderer } from '../components/widgets/WidgetRenderer.tsx';

/**
 * 根据域名自动获取 favicon
 * NOTE: 使用 Google Favicon API 作为备选方案
 */
function getFaviconUrl(siteUrl: string): string {
  try {
    const url = new URL(siteUrl);
    // 切换至境内外访问更稳定的图标抓取服务，解决 Google S2 壁垒问题
    return `https://favicon.im/${url.hostname}`;
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
    time: '', 
    date: '' 
  };
}

export default function Home() {
  const { state, isReady } = useData();
  const { settings, categories, widgets = [] } = state;
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
        iconUrl = `https://favicon.im/${urlObj.hostname}`;
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

  // 监听滚动，控制标题显隐（向下滚动隐藏，向上滚动或在顶部显示）
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const safeScrollY = Math.max(0, currentScrollY);

      if (safeScrollY <= 20) {
        setIsScrolled(false);
      } else if (safeScrollY > lastScrollY) {
        setIsScrolled(true);
      } else if (safeScrollY < lastScrollY) {
        setIsScrolled(false);
      }
      lastScrollY = safeScrollY;
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

  // 如果数据还没准备好，渲染加载界面（必须放在所有 Hook 之后以遵循 Rules of Hooks）
  if (!isReady) {
    return (
      <div className="fixed inset-0 z-[1000] bg-[#0a0a0a] flex flex-col items-center justify-center">
        <div className="relative">
          {/* 品牌标识 */}
          <div className="text-3xl font-extralight tracking-[0.5em] text-white/90 uppercase animate-pulse">
            {settings.siteName || 'YuNest'}
          </div>
          {/* 进度条装饰 */}
          <div className="mt-8 w-48 h-[1px] bg-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/40 animate-loading-bar" />
          </div>
        </div>
      </div>
    );
  }

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
      <main className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 sm:px-6 pt-16 sm:pt-24">

        {/* 移动端显示的标题 (如果没有 Widget 也许需要保留) */}
        <header className="text-center mb-8 animate-fade-in sm:hidden" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-xs font-bold tracking-[0.4em] text-white/40 uppercase">
            {settings.siteName}
          </h1>
        </header>

        {/* 全局小组件区域 */}
        {widgets && widgets.length > 0 && (
          <div 
            className={`w-full max-w-7xl mb-12 animate-fade-in flex ${
              settings.widgetAlignment === 'left' ? 'justify-start' : 
              settings.widgetAlignment === 'right' ? 'justify-end' : 
              'justify-center'
            }`} 
            style={{ animationDelay: '0.2s' }}
          >
            <div 
              className="grid gap-3 sm:gap-4 px-1" 
              style={{ 
                gridTemplateColumns: 'repeat(auto-fit, var(--widget-size))',
                gridAutoRows: 'var(--widget-size)',
                gridAutoFlow: 'dense',
                width: '100%',
                justifyContent: settings.widgetAlignment === 'left' ? 'start' : 
                                settings.widgetAlignment === 'right' ? 'end' : 
                                'center'
              }}
            >
              {widgets.map((widget) => {
                const colSpanClass = 
                  widget.size?.startsWith('4x') ? 'col-span-2 sm:col-span-4' :
                  widget.size?.startsWith('3x') ? 'col-span-2 sm:col-span-3' :
                  widget.size?.startsWith('2x') ? 'col-span-2' : 'col-span-1';
                const rowSpanClass = widget.size?.endsWith('x2') ? 'row-span-2' : 'row-span-1';
                // NOTE: 移除了 aspect-[...] 以避免内部高度冲突，完全依赖 grid-auto-rows
                
                return (
                  <div key={widget.id} className={`${colSpanClass} ${rowSpanClass} h-full w-full`}>
                    <WidgetRenderer bookmark={widget} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3 sm:gap-4 px-1">
                  {category.bookmarks.map((bookmark) => (
                    <a
                      key={bookmark.id}
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onContextMenu={(e) => handleContextMenu(e, bookmark)}
                      className="flex flex-col items-center justify-center group w-full h-full col-span-1 row-span-1 aspect-square glass rounded-2xl p-2 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                    >
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:-translate-y-1 transition-transform duration-300">
                        {renderIcon(bookmark.icon, bookmark.url, 'w-8 h-8')}
                      </div>
                      <span className="text-[12px] mt-1 font-medium text-white/50 group-hover:text-white transition-colors duration-300 text-center truncate w-full px-1">
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
                </div>
                {authError && (
                  <div className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-widest text-red-400/90 uppercase animate-fade-in">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {t.authFailed}
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  </div>
                )}

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
