/**
 * YuNest 前台首页
 * NOTE: 左侧分类侧边栏 + 右侧卡片流，卡片尺寸由后台控制
 *       已适配桌面端 / 平板 / 手机三档，移动端每行 2 个卡片
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useData, PRESET_SEARCH_ENGINES } from '../context/DataContext.tsx';
import {
  Search,
  Settings as SettingsIcon,
  ExternalLink,
  Lock,
  X,
  Globe,
  BookOpen,
  Github,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations.ts';
import { WidgetRenderer } from '../components/widgets/WidgetRenderer.tsx';
import { getFaviconProxyUrl, normalizeIconUrl } from '../lib/favicon.ts';
import { FaviconImg } from '../components/FaviconImg.tsx';


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
      return new Intl.DateTimeFormat(language, { ...options, timeZone: 'Asia/Shanghai' }).format(now);
    }
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: timezoneID || undefined
  };
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', timeZone: timezoneID || undefined
  };

  return {
    time: formatWithFallback(timeOptions),
    date: formatWithFallback(dateOptions)
  };
}

/** 判断是否为移动端屏幕 */
function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}

export default function Home() {
  const { state, isReady } = useData();
  const { settings, categories, widgets = [] } = state;
  const t = TRANSLATIONS[settings.language || 'zh-CN'];
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('yunest_auth') === 'true');
  const [isBgLoaded, setIsBgLoaded] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, bookmark: any } | null>(null);

  const [activeSidebarId, setActiveSidebarId] = useState<string>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // ====== 前台卡片配置（长宽独立，移动端自动适配） ======
  const baseCardHeight = settings.cardHeight || 80;
  const baseCardWidth = settings.cardWidth || 240;

  const cardHeight = isMobile ? Math.max(64, Math.round(baseCardHeight * 0.9)) : baseCardHeight;
  const cardWidth = isMobile ? 'calc(50% - 6px)' : `${baseCardWidth}px`;

  const iconBoxSize = Math.max(28, Math.round(cardHeight * 0.56));

  const titleFontPx = isMobile
    ? Math.max(12, Math.round(cardHeight * 0.17))
    : Math.max(14, Math.round(cardHeight * 0.19));

  const descFontPx = isMobile
    ? Math.max(10, Math.round(cardHeight * 0.13))
    : Math.max(11, Math.round(cardHeight * 0.14));

  const sidebarCategories = useMemo(() => {
    return categories
      .filter(c => c.bookmarks.length > 0)
      .filter(c => !c.isHidden || isAdmin);
  }, [categories, isAdmin]);

  const visibleCategories = useMemo(() => {
    if (activeSidebarId === 'all') return sidebarCategories;
    return sidebarCategories.filter(c => c.id === activeSidebarId);
  }, [sidebarCategories, activeSidebarId]);

  const handleContextMenu = (e: React.MouseEvent, bookmark: any) => {
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

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const safeScrollY = Math.max(0, currentScrollY);
      if (safeScrollY <= 20) setIsScrolled(false);
      else if (safeScrollY > lastScrollY) setIsScrolled(true);
      else if (safeScrollY < lastScrollY) setIsScrolled(false);
      lastScrollY = safeScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const blurValue = (settings.glassEffectOpacity / 100) * 40;
    const opacityValue = 0.1 + (settings.glassEffectOpacity / 100) * 0.7;
    root.style.setProperty('--glass-blur', `${blurValue}px`);
    root.style.setProperty('--glass-opacity', `${opacityValue}`);
  }, [settings.glassEffectOpacity]);

  const handleSelectCategory = (id: string) => {
    setActiveSidebarId(id);
    setIsMobileSidebarOpen(false);
  };

  const bgUrl = useMemo(() => {
    if (settings.wallpaperType === 'local' && settings.localWallpaper) return settings.localWallpaper;
    const url = settings.wallpaperUrl || 'https://pic.yumekai.top/pic?img=ua';
    if (settings.wallpaperType === 'api') {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}t=${Date.now()}`;
    }
    return url;
  }, [settings.wallpaperType, settings.wallpaperUrl, settings.localWallpaper]);

  const handleAdminAuth = (e?: React.FormEvent) => {
    e?.preventDefault();
    const adminPass = (import.meta as any).env.ADMIN_PASSWORD || 'admin1234';
    if (password === adminPass) {
      sessionStorage.setItem('yunest_auth', 'true');
      sessionStorage.setItem('yunest_admin_pwd', password);
      setShowAuthModal(false);
      setIsAdmin(true);
      setPassword('');
      if (settings.authRedirect) navigate('/admin/settings');
    } else {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 2000);
    }
  };

  const openAuth = () => {
    if (sessionStorage.getItem('yunest_auth') === 'true') navigate('/admin/settings');
    else setShowAuthModal(true);
  };

  if (!isReady) {
    return (
      <div className="fixed inset-0 z-[1000] bg-[#0a0a0a] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="text-3xl font-extralight tracking-[0.5em] text-white/90 uppercase animate-pulse">
            {settings.siteName || 'YuNest'}
          </div>
          <div className="mt-8 w-48 h-[1px] bg-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/40 animate-loading-bar" />
          </div>
        </div>
      </div>
    );
  }

  const renderIcon = (iconName: string, siteUrl?: string, size: string = 'w-5 h-5') => {
    if (iconName && (iconName.startsWith('http://') || iconName.startsWith('https://') || iconName.startsWith('/') || iconName.startsWith('data:'))) {
      const src = normalizeIconUrl(iconName);
      const isProxyUrl = src.startsWith('/api/icon-proxy');
      if (isProxyUrl) return <FaviconImg src={src} className={`${size} object-contain rounded-sm`} fallbackClassName={`${size} text-white/50`} />;
      const fallbackProxySrc = siteUrl ? getFaviconProxyUrl(siteUrl) : '';
      return <FaviconImg src={src} fallbackSrc={fallbackProxySrc || undefined} className={`${size} object-contain rounded-sm`} fallbackClassName={`${size} text-white/50`} />;
    }
    const IconComponent = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    if (IconComponent) return <IconComponent className={`${size} text-white/70`} />;
    if (siteUrl) {
      const proxyUrl = getFaviconProxyUrl(siteUrl);
      if (proxyUrl) return <FaviconImg src={proxyUrl} className={`${size} object-contain rounded-sm`} fallbackClassName={`${size} text-white/50`} />;
    }
    return <Icons.Globe className={`${size} text-white/70`} />;
  };

  const renderSidebarContent = (isMobileMode: boolean = false) => {
    const collapsed = isMobileMode ? false : isCollapsed;

    return (
      <div className={`flex flex-col w-full h-full ${isMobileMode ? 'gap-1.5 px-3 py-4 rounded-3xl glass shadow-2xl' : ''}`}>
        <div className="flex-1 flex flex-col justify-center items-center w-full overflow-hidden px-3 py-4">
          <div className="flex flex-col items-center gap-1.5 w-full overflow-y-auto sidebar-scroll" style={{ maxHeight: '100%' }}>
            <div
              onClick={() => handleSelectCategory('all')}
              title={collapsed ? '全部' : undefined}
              className={`flex items-center justify-center w-full px-3 py-3 rounded-2xl cursor-pointer transition-all duration-300 group flex-shrink-0 ${
                activeSidebarId === 'all'
                  ? 'bg-white/15 text-white shadow-lg border border-white/10'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <LayoutGrid className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
                activeSidebarId === 'all' ? 'text-white scale-110' : 'text-white/40 group-hover:text-white/70'
              }`} />
              {!collapsed && (
                <>
                  <span className="ml-3 flex-1 text-[14px] font-medium tracking-wide text-left truncate">全部</span>
                  <span className={`text-[12px] font-mono ml-1 ${activeSidebarId === 'all' ? 'text-white/60' : 'text-white/25'}`}>
                    {sidebarCategories.reduce((sum, c) => sum + c.bookmarks.length, 0)}
                  </span>
                </>
              )}
            </div>

            <div className="w-full h-px bg-white/5 my-1 flex-shrink-0" />

            {sidebarCategories.map((category) => {
              const isActive = activeSidebarId === category.id;
              return (
                <div
                  key={category.id}
                  onClick={() => handleSelectCategory(category.id)}
                  title={collapsed ? category.title : undefined}
                  className={`flex items-center justify-center w-full px-3 py-3 rounded-2xl cursor-pointer transition-all duration-300 group flex-shrink-0 ${
                    isActive
                      ? 'bg-white/15 text-white shadow-lg border border-white/10'
                      : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                    {renderIcon(category.icon, undefined, 'w-5 h-5')}
                  </div>
                  {!collapsed && (
                    <>
                      <span className="ml-3 flex-1 text-[14px] font-medium tracking-wide text-left truncate">{category.title}</span>
                      <span className={`text-[12px] font-mono ml-1 ${isActive ? 'text-white/60' : 'text-white/25'}`}>
                        {category.bookmarks.length}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={`w-full flex items-center ${collapsed ? 'flex-col' : 'flex-row'} gap-2 px-3 pb-3 border-t border-white/5 flex-shrink-0`}>
          <button
            onClick={openAuth}
            title={t.settingsIcon}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all duration-300 cursor-pointer border-0 bg-transparent"
          >
            <SettingsIcon className="w-4 h-4" />
            {!collapsed && <span className="text-[13px] font-medium">设置</span>}
          </button>
          <a
            href="https://navdocs.072199.xyz/"
            target="_blank"
            rel="noreferrer"
            title={t.docsTooltip}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all duration-300 no-underline"
          >
            <BookOpen className="w-4 h-4" />
            {!collapsed && <span className="text-[13px] font-medium">文档</span>}
          </a>
        </div>

        {!isMobileMode && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? '展开侧边栏' : '折叠侧边栏'}
            className="flex items-center justify-center w-full py-2.5 px-3 mb-3 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all duration-300 cursor-pointer border-0 bg-transparent flex-shrink-0"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="ml-2 text-[13px] font-medium">收起</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  const sidebarWidth = isCollapsed ? 'w-[72px]' : 'w-[230px]';

  return (
    <div className="text-white min-h-screen font-sans selection:bg-white/20 relative">
      {/* 背景壁纸层 */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-[#0a0a0a]"
        style={settings.wallpaperType === 'color' ? { backgroundColor: settings.backgroundColor } : {}}>
        {settings.wallpaperType !== 'color' && !isBgLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c2c] via-[#4a192c] to-[#121212] animate-pulse opacity-40" />
        )}
        {settings.wallpaperType !== 'color' && (
          <img
            src={bgUrl}
            alt="Background"
            onLoad={() => setIsBgLoaded(true)}
            className={`w-full h-full object-cover animate-bg-drift transition-opacity duration-1000 ${isBgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== 'https://pic.yumekai.top/pic?img=ua') target.src = 'https://pic.yumekai.top/pic?img=ua';
            }}
          />
        )}
        {settings.darkMask && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none transition-opacity duration-500"
            style={{ opacity: settings.darkMaskOpacity / 100 }} />
        )}
        {settings.glassEffect && (
          <div className="absolute inset-0 pointer-events-none transition-all duration-500"
            style={{
              backdropFilter: `blur(${(settings.glassEffectOpacity / 100) * 12}px)`,
              WebkitBackdropFilter: `blur(${(settings.glassEffectOpacity / 100) * 12}px)`,
              backgroundColor: `rgba(0, 0, 0, ${(settings.glassEffectOpacity / 100) * 0.08})`
            }} />
        )}
      </div>

      {/* 移动端汉堡按钮 */}
      <div className={`fixed top-4 left-4 z-50 md:hidden transition-all duration-500 ${
        isScrolled ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}>
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-3 rounded-2xl glass text-white/70 hover:text-white transition-all duration-300 hover:bg-white/10 border-0 cursor-pointer flex items-center justify-center"
          title="打开分类菜单"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* 桌面端侧边栏 */}
      <aside className={`hidden md:flex fixed left-0 top-0 bottom-0 z-30 flex-col transition-all duration-300 ease-in-out ${sidebarWidth}`}>
        {renderSidebarContent(false)}
      </aside>

      {/* 移动端抽屉 */}
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />
      <aside
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-[70] w-[280px] max-w-[85vw] px-3 md:hidden transition-transform duration-300 ease-out ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="relative">
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md text-white/70 hover:text-white flex items-center justify-center border border-white/10 cursor-pointer"
            title="关闭菜单"
          >
            <X className="w-4 h-4" />
          </button>
          {renderSidebarContent(true)}
        </div>
      </aside>

      {/* 右侧主内容区 */}
      <div
        className={`relative z-10 flex min-h-screen transition-all duration-300 ${
          !isMobile && (isCollapsed ? 'md:pl-[72px]' : 'md:pl-[230px]')
        } w-full`}
        style={{ minWidth: 0 }}
      >
        <main
          className={`flex-1 flex flex-col items-center justify-start min-h-screen w-full ${
            isMobile ? 'px-3 pt-20' : 'px-4 sm:px-6 pt-16 sm:pt-24'
          }`}
          style={{ minWidth: 0 }}
        >
          {/* 移动端顶部标题 */}
          {isMobile && (
            <header className="text-center mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <a
                href="https://navdocs.072199.xyz/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold tracking-[0.4em] text-white/40 hover:text-white/80 uppercase no-underline transition-colors"
                title={t.docsTooltip}
              >
                {settings.siteName}
              </a>
            </header>
          )}

          {/* 小组件区域 */}
          {widgets && widgets.length > 0 && (
            <div
              className={`w-full max-w-7xl mb-6 animate-fade-in flex relative z-40 ${
                settings.widgetAlignment === 'left' ? 'justify-start' :
                settings.widgetAlignment === 'right' ? 'justify-end' : 'justify-center'
              }`}
              style={{ animationDelay: '0.2s' }}
            >
              <div
                className="flex flex-wrap gap-3 sm:gap-4 px-1 relative z-40"
                style={{
                  width: '100%',
                  justifyContent: settings.widgetAlignment === 'left' ? 'flex-start' :
                                  settings.widgetAlignment === 'right' ? 'flex-end' : 'center'
                }}
              >
                {widgets.map((widget, index) => {
                  const widthClass =
                    widget.size?.startsWith('4x') ? 'widget-width-4x' :
                    widget.size?.startsWith('3x') ? 'widget-width-3x' :
                    widget.size?.startsWith('2x') ? 'widget-width-2x' : 'widget-width-1x';
                  const heightClass = !widget.showBackground && !widget.size?.endsWith('x2')
                    ? 'h-auto'
                    : widget.size?.endsWith('x2') ? 'widget-height-2x' : 'widget-height-1x';

                  return (
                    <React.Fragment key={widget.id}>
                      {widget.wrapLine && index > 0 && <div className="w-full h-0 flex-shrink-0" />}
                      <div className={`${widthClass} ${heightClass} flex-shrink-0 relative z-40`}>
                        <WidgetRenderer bookmark={widget} />
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* 书签分组 */}
          <div className={`w-full flex flex-col pb-24 px-0 sm:px-1 ${isMobile ? 'gap-10' : 'gap-14'}`}>
            {visibleCategories.length === 0 ? (
              <div className="text-center text-white/40 text-base py-20 animate-fade-in">
                该分类下暂无内容
              </div>
            ) : (
              visibleCategories.map((category, catIndex) => (
                <section
                  key={category.id}
                  className="animate-fade-in-scale"
                  style={{ animationDelay: `${0.4 + catIndex * 0.1}s` }}
                >
                  <h2 className={`font-bold uppercase tracking-[0.2em] text-white/60 flex items-center gap-3 ${
                    isMobile ? 'text-sm px-1 mb-4' : 'text-base sm:text-lg px-3 mb-6'
                  }`}>
                    {renderIcon(category.icon, undefined, 'w-5 h-5')}
                    {category.title}
                    <span className="text-white/25 font-medium text-sm">({category.bookmarks.length})</span>
                  </h2>

                  {/* 卡片列表 */}
                  <div className={`flex flex-wrap w-full min-w-0 ${isMobile ? 'gap-3' : 'gap-4 sm:gap-5 px-1'}`}>
                    {category.bookmarks.map((bookmark) => (
                      <a
                        key={bookmark.id}
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onContextMenu={(e) => handleContextMenu(e, bookmark)}
                        className={`flex items-center rounded-2xl glass hover:bg-white/10 hover:-translate-y-0.5 hover:border-white/15 transition-all duration-300 group min-w-0 ${
                          isMobile ? 'p-3' : 'p-3 sm:p-4'
                        }`}
                        style={{
                          width: typeof cardWidth === 'number' ? `${cardWidth}px` : cardWidth,
                          height: `${cardHeight}px`,
                          maxWidth: '100%',
                        }}
                      >
                        <div
                          className="rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors duration-300 shrink-0"
                          style={{
                            width: `${iconBoxSize}px`,
                            height: `${iconBoxSize}px`,
                            marginRight: isMobile ? '10px' : '12px',
                          }}
                        >
                          {renderIcon(
                            bookmark.icon,
                            bookmark.url,
                            cardHeight < 70 ? 'w-4 h-4' : cardHeight < 110 ? 'w-5 h-5' : 'w-6 h-6'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-bold text-white group-hover:text-white transition-colors duration-300 truncate"
                            style={{ fontSize: `${titleFontPx}px` }}
                          >
                            {bookmark.title}
                          </p>
                          {bookmark.description && cardHeight >= 70 && (
                            <p
                              className="text-white/65 tracking-wide mt-1 truncate"
                              style={{ fontSize: `${descFontPx}px` }}
                            >
                              {bookmark.description}
                            </p>
                          )}
                        </div>
                        {!isMobile && (
                          <ExternalLink className="w-4 h-4 text-white/0 group-hover:text-white/30 transition-all duration-300 shrink-0 ml-2" />
                        )}
                      </a>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>

          {/* 页脚（保留作者信息） */}
          <footer className={`mt-auto pt-8 pb-10 text-center animate-fade-in flex flex-col items-center gap-3.5 ${
            isMobile ? 'pb-6' : ''
          }`} style={{ animationDelay: '1.2s' }}>
            <div className={`inline-flex items-center gap-2 font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] ${
              isMobile ? 'flex-col gap-2 text-[11px]' : 'text-xs sm:text-sm'
            }`}>
              <span className="tracking-wider uppercase select-none text-white/50">{t.builtBy}</span>
              <span className={`text-white/30 select-none ${isMobile ? 'hidden' : ''}`}>•</span>
              <div className={`flex items-center ${isMobile ? 'gap-4' : 'gap-3'}`}>
                <a
                  href="https://navdocs.072199.xyz/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors duration-200"
                  title={t.docsTooltip}
                >
                  <BookOpen className="w-4 h-4 text-[#ec5b13]" />
                  <span>{t.docSite}</span>
                </a>
                <span className="text-white/30 select-none">•</span>
                <a
                  href="https://github.com/YUME-0721/YuNest"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors duration-200"
                  title={t.githubRepo}
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* 认证弹窗 */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity" onClick={() => setShowAuthModal(false)} />
          <div className="relative w-full max-w-sm glass-modal rounded-3xl p-8 shadow-2xl animate-fade-in-scale text-white">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-2">
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
                <button type="submit" className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-white/90 active:scale-95 transition-all shadow-xl shadow-white/5">
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
            onClick={() => { window.open(contextMenu.bookmark.url, '_blank'); setContextMenu(null); }}
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
            onClick={() => { window.open(contextMenu.bookmark.lanUrl, '_blank'); setContextMenu(null); }}
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
