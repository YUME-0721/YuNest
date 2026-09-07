import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useData, PRESET_SEARCH_ENGINES, Bookmark } from '../../context/DataContext';
import { Search, Globe, ExternalLink, CornerDownLeft } from 'lucide-react';
import * as Icons from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations';
import { getFaviconProxyUrl, normalizeIconUrl, isTransparentPlaceholder } from '../../lib/favicon';

interface SearchWidgetProps {
  size: string;
  showBackground?: boolean;
}

interface MatchedItem {
  bookmark: Bookmark;
  categoryTitle: string;
  categoryIcon?: string;
}

/** 渲染图标组件 — 统一走代理 */
const BookmarkIcon: React.FC<{ icon?: string; siteUrl?: string; className?: string }> = ({
  icon,
  siteUrl,
  className = 'w-4 h-4',
}) => {
  const [imgError, setImgError] = useState(false);

  // 1. URL 图片（规范化后统一走代理）
  if (icon && (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/') || icon.startsWith('data:')) && !imgError) {
    const src = normalizeIconUrl(icon);
    const isProxyUrl = src.startsWith('/api/icon-proxy');
    return (
      <img
        src={src}
        alt=""
        className={`${className} object-contain rounded-sm`}
        loading="lazy"
        onLoad={(e) => {
          // 代理返回透明 PNG = 所有来源失败，降级到兜底
          if (isTransparentPlaceholder(e.target as HTMLImageElement)) {
            if (!isProxyUrl && siteUrl) {
              // 直连真实图片返回透明 PNG（几乎不会，但作为防御）
              (e.target as HTMLImageElement).src = getFaviconProxyUrl(siteUrl);
            } else {
              setImgError(true);
            }
          }
        }}
        onError={() => {
          // 直连真实图片失败，尝试代理一次
          if (!isProxyUrl && siteUrl) {
            const el = document.querySelector(`img[src="${src}"]`) as HTMLImageElement | null;
            if (el && !el.getAttribute('data-retried')) {
              el.setAttribute('data-retried', 'true');
              el.src = getFaviconProxyUrl(siteUrl);
              return;
            }
          }
          setImgError(true);
        }}
      />
    );
  }

  // 2. Lucide 图标
  if (icon) {
    const IconComponent = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[icon];
    if (IconComponent) {
      return <IconComponent className={`${className} text-white/80`} />;
    }
  }

  // 3. 无 icon 字段时自动走代理抓 favicon
  if (siteUrl && !imgError) {
    const proxyUrl = getFaviconProxyUrl(siteUrl);
    if (proxyUrl) {
      return (
        <img
          src={proxyUrl}
          alt=""
          className={`${className} object-contain rounded-sm`}
          loading="lazy"
          onLoad={(e) => {
            if (isTransparentPlaceholder(e.target as HTMLImageElement)) {
              setImgError(true);
            }
          }}
          onError={() => setImgError(true)}
        />
      );
    }
  }

  // 4. 兜底 Globe
  return <Globe className={`${className} text-white/70`} />;
};

export const SearchWidget: React.FC<SearchWidgetProps> = ({ size, showBackground }) => {
  const { state } = useData();
  const { settings, categories } = state;
  const t = TRANSLATIONS[settings.language || 'zh-CN'];
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const dropdownListRef = useRef<HTMLDivElement>(null);
  const modalDropdownListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAdmin = useMemo(() => {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('yunest_auth') === 'true';
    }
    return false;
  }, []);

  const availableEngines = useMemo(() => {
    const hasCustom = !PRESET_SEARCH_ENGINES.some(e => e.url === settings.searchEngine);
    if (hasCustom && settings.searchEngine) {
      let iconUrl = '';
      try {
        iconUrl = getFaviconProxyUrl(settings.searchEngine);
      } catch (e) {
        // Fallback icon handled in render
      }
      return [
        {
          id: 'custom',
          name: t.searchEngineOther || 'Custom',
          url: settings.searchEngine,
          icon: iconUrl
        },
        ...PRESET_SEARCH_ENGINES
      ];
    }
    return PRESET_SEARCH_ENGINES;
  }, [settings.searchEngine, t.searchEngineOther]);

  const [currentEngine, setCurrentEngine] = useState(
    availableEngines.find(e => e.url === settings.searchEngine) || availableEngines[0]
  );

  // 收集所有可搜索的书签
  const allBookmarks = useMemo(() => {
    const list: MatchedItem[] = [];
    categories.forEach(cat => {
      if (cat.isHidden && !isAdmin) return;
      cat.bookmarks.forEach(bm => {
        if (bm.itemType !== 'widget') {
          list.push({ bookmark: bm, categoryTitle: cat.title, categoryIcon: cat.icon });
        }
      });
    });
    return list;
  }, [categories, isAdmin]);

  // 根据当前输入词匹配书签
  const matchedBookmarks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return allBookmarks.filter(({ bookmark, categoryTitle }) => {
      const titleMatch = bookmark.title?.toLowerCase().includes(q);
      const urlMatch = bookmark.url?.toLowerCase().includes(q);
      const lanUrlMatch = bookmark.lanUrl?.toLowerCase().includes(q);
      const descMatch = bookmark.description?.toLowerCase().includes(q);
      const catMatch = categoryTitle?.toLowerCase().includes(q);
      return titleMatch || urlMatch || lanUrlMatch || descMatch || catMatch;
    });
  }, [allBookmarks, searchQuery]);

  // 总可选项数量（包含搜索引擎选项）
  const totalOptions = useMemo(() => {
    if (matchedBookmarks.length > 0) {
      return matchedBookmarks.length + 1; // 书签列表 + 1个搜索引擎项
    }
    return 1; // 仅搜索引擎项
  }, [matchedBookmarks]);

  // 当搜索关键词变化时，默认高亮第 1 项
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // 自动滚动高亮项到视口
  useEffect(() => {
    const activeList = isModalOpen ? modalDropdownListRef.current : dropdownListRef.current;
    if (activeList) {
      const activeEl = activeList.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, isModalOpen]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
  };

  const getSearchUrl = (query: string) => {
    return currentEngine.url.includes('%s')
      ? currentEngine.url.replace('%s', encodeURIComponent(query))
      : `${currentEngine.url}${encodeURIComponent(query)}`;
  };

  /** 执行选中项操作：跳转到书签或搜索引擎 */
  const triggerSelect = (index: number) => {
    const q = searchQuery.trim();
    if (matchedBookmarks.length > 0 && index >= 0 && index < matchedBookmarks.length) {
      // 打开选中的书签
      const item = matchedBookmarks[index];
      window.open(item.bookmark.url, '_blank');
      setSearchQuery('');
      setIsFocused(false);
      setIsModalOpen(false);
    } else {
      // 使用搜索引擎搜索
      if (q) {
        window.open(getSearchUrl(q), '_blank');
        setSearchQuery('');
        setIsFocused(false);
        setIsModalOpen(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchQuery.trim()) {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalOptions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      triggerSelect(selectedIndex);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsFocused(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleEngineSwitch = () => {
    const currentIndex = availableEngines.findIndex(e => e.id === currentEngine.id);
    const nextIndex = (currentIndex + 1) % availableEngines.length;
    setCurrentEngine(availableEngines[nextIndex]);
  };

  const isDropdownOpen = (isFocused || isModalOpen) && searchQuery.trim().length > 0;

  /** 渲染下拉匹配列表 */
  const renderDropdownContent = (isModal: boolean = false) => {
    if (!isDropdownOpen) return null;

    const listRef = isModal ? modalDropdownListRef : dropdownListRef;

    return (
      <div
        ref={listRef}
        className={`absolute left-0 right-0 top-full mt-2 z-[999] bg-[#14161f] border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col ${
          isModal ? 'max-h-[340px]' : 'max-h-[360px]'
        }`}
      >
        <div className="overflow-y-auto p-1.5 flex flex-col gap-1 custom-scrollbar">
          {/* 匹配到的书签列表 */}
          {matchedBookmarks.map((item, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <div
                key={item.bookmark.id}
                data-index={idx}
                onMouseEnter={() => setSelectedIndex(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  triggerSelect(idx);
                }}
                className={`group px-3 py-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-white/15 border border-white/25 text-white shadow-sm'
                    : 'hover:bg-white/10 border border-transparent text-white/90'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <BookmarkIcon icon={item.bookmark.icon} siteUrl={item.bookmark.url} className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-white truncate group-hover:text-white">
                        {item.bookmark.title}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white/70 font-normal flex-shrink-0 border border-white/10">
                        {item.categoryTitle}
                      </span>
                    </div>
                    {(item.bookmark.description || item.bookmark.url) && (
                      <span className="text-xs text-white/50 truncate">
                        {item.bookmark.description || item.bookmark.url}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-white/40 group-hover:text-white/80 flex-shrink-0">
                  {isSelected && (
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white/90 mr-1 hidden sm:inline">
                      ↵
                    </span>
                  )}
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}

          {/* 搜索引擎搜索项 */}
          {matchedBookmarks.length > 0 ? (
            <div
              data-index={matchedBookmarks.length}
              onMouseEnter={() => setSelectedIndex(matchedBookmarks.length)}
              onMouseDown={(e) => {
                e.preventDefault();
                triggerSelect(matchedBookmarks.length);
              }}
              className={`px-3 py-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all mt-0.5 ${
                selectedIndex === matchedBookmarks.length
                  ? 'bg-white/15 border border-white/25 text-white shadow-sm'
                  : 'hover:bg-white/10 border border-transparent text-white/70'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  {currentEngine.icon ? (
                    <img src={currentEngine.icon} className="w-4 h-4 object-contain" alt="" />
                  ) : (
                    <Search className="w-4 h-4 text-white/80" />
                  )}
                </div>
                <div className="text-xs sm:text-sm text-white/90 truncate">
                  {t.searchDropdownInEngine
                    ? t.searchDropdownInEngine.replace('{engine}', currentEngine.name).replace('{query}', searchQuery)
                    : `在 ${currentEngine.name} 中搜索 "${searchQuery}"`}
                </div>
              </div>
              <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded text-white/70 flex-shrink-0">
                ↵ Enter
              </span>
            </div>
          ) : (
            <div
              data-index={0}
              onMouseEnter={() => setSelectedIndex(0)}
              onMouseDown={(e) => {
                e.preventDefault();
                triggerSelect(0);
              }}
              className="px-3 py-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer bg-white/15 border border-white/25 text-white transition-all shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  {currentEngine.icon ? (
                    <img src={currentEngine.icon} className="w-4 h-4 object-contain" alt="" />
                  ) : (
                    <Search className="w-4 h-4 text-white/80" />
                  )}
                </div>
                <div className="text-xs sm:text-sm text-white/90 truncate">
                  {t.searchDropdownNoMatch
                    ? t.searchDropdownNoMatch.replace('{engine}', currentEngine.name).replace('{query}', searchQuery)
                    : `未找到匹配书签，按 Enter 在 ${currentEngine.name} 中搜索`}
                </div>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white/90 flex-shrink-0">
                ↵ Enter
              </span>
            </div>
          )}
        </div>

        {/* 底部快捷键操作提示 */}
        <div className="px-3 py-1.5 bg-black/50 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40 select-none">
          <span>{t.searchDropdownHint || '↑ ↓ 切换 · ↵ 跳转 · ESC 关闭'}</span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3" />
            {currentEngine.name}
          </span>
        </div>
      </div>
    );
  };

  const bg = showBackground
    ? 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 shadow-lg'
    : 'bg-transparent hover:bg-white/10 border border-transparent';

  // 1x1 尺寸时渲染图标按钮，点击弹出搜索模态框
  if (size.startsWith('1x')) {
    return (
      <>
        <button 
          onClick={() => setIsModalOpen(true)}
          className={`w-full h-full ${bg} rounded-2xl flex flex-col items-center justify-center p-3 text-white transition-all group cursor-pointer`}
        >
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform shadow-inner">
            {currentEngine.icon ? (
              <img src={currentEngine.icon} className="w-5 h-5 object-contain" alt="engine" />
            ) : (
              <Search className="w-5 h-5 text-white" />
            )}
          </div>
          <span className="text-[10px] sm:text-xs font-semibold opacity-85 truncate max-w-full">{currentEngine.name}</span>
        </button>

        {isModalOpen && ReactDOM.createPortal(
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-start justify-center pt-[12vh] px-4"
            style={{ margin: 0, padding: '12vh 1rem 0' }}
            onClick={() => setIsModalOpen(false)}
          >
            <div
              ref={modalContainerRef}
              className="bg-[#14161f] border border-white/20 rounded-3xl p-5 w-full max-w-xl shadow-2xl flex flex-col gap-4 relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={handleEngineSwitch}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10 cursor-pointer"
                  title={`Switch Engine (Current: ${currentEngine.name})`}
                >
                  {currentEngine.icon ? (
                    <img src={currentEngine.icon} className="w-4 h-4 object-contain" alt="engine" />
                  ) : (
                    <Search className="w-4 h-4 text-white/80" />
                  )}
                </button>
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => handleSearchQueryChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t.searchPlaceholder.replace('{engine}', currentEngine.name)}
                  className="w-full h-14 pl-14 pr-14 rounded-2xl bg-black/50 border border-white/20 outline-none text-white text-base placeholder-white/40 focus:border-white/40 focus:bg-black/70 focus:ring-2 focus:ring-white/15 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => triggerSelect(selectedIndex)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-9 px-4 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl transition-colors font-medium flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* 模态框内的下拉搜索匹配 */}
                {renderDropdownContent(true)}
              </div>

              {/* 引擎切换栏 */}
              <div className="flex gap-2 justify-center flex-wrap pt-1">
                {availableEngines.map(eng => (
                  <button
                    key={eng.id}
                    onClick={() => setCurrentEngine(eng)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      currentEngine.id === eng.id
                        ? 'bg-white/20 text-white border border-white/30 shadow-sm'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-transparent'
                    }`}
                  >
                    {eng.icon && <img src={eng.icon} className="w-3.5 h-3.5 object-contain" alt="" />}
                    {eng.name}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  const heightClass = showBackground ? 'h-full' : 'h-auto';
  const paddingClass = showBackground ? 'p-4' : 'py-1 px-4';
  const containerBg = showBackground
    ? 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 shadow-lg'
    : 'bg-transparent';

  return (
    <div 
      ref={containerRef}
      className={`w-full ${heightClass} ${containerBg} rounded-2xl flex items-center justify-center ${paddingClass}`}
    >
      <div className={`w-full relative group ${
        size === '3x1' ? 'max-w-lg' :
        size === '4x1' ? 'max-w-xl' :
        'max-w-md'
      }`}>
        <button
          type="button"
          onClick={handleEngineSwitch}
          className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 flex items-center justify-center bg-white/10 hover:bg-white/30 rounded-full transition-colors z-10 cursor-pointer ${
            size.startsWith('1x') ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-7 h-7'
          }`}
          title={`Switch Engine (Current: ${currentEngine.name})`}
        >
          {currentEngine.icon ? (
            <img 
              src={currentEngine.icon} 
              className={`${size.startsWith('1x') ? 'w-3 h-3' : 'w-4 h-4'} object-contain`} 
              alt="engine"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }} 
            />
          ) : (
            <Search className={`${size.startsWith('1x') ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
          )}
        </button>

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchQueryChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={t.searchPlaceholder.replace('{engine}', size.startsWith('1x') ? '' : currentEngine.name)}
          className={`w-full bg-black/30 backdrop-blur-md border outline-none text-white placeholder-white/60 transition-all shadow-lg hover:shadow-xl ${
            isFocused ? 'border-white/30 bg-black/45 ring-1 ring-white/10' : 'border-white/10 hover:border-white/20 hover:bg-black/35'
          } ${
            size.startsWith('1x') ? 'h-10 pl-9 pr-8 sm:pl-11 rounded-xl text-xs' : 'h-14 pl-14 pr-14 rounded-2xl'
          }`}
        />

        <button
          type="button"
          onClick={() => triggerSelect(selectedIndex)}
          className={`absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white transition-colors font-medium flex items-center justify-center cursor-pointer ${
            size.startsWith('1x') ? 'h-8 w-8 rounded-lg' : 'h-10 px-4 rounded-xl gap-2'
          }`}
        >
          <Search className={size.startsWith('1x') ? 'w-3 h-3' : 'w-4 h-4'} />
        </button>

        {/* 首页常规搜索框的下拉匹配列表 */}
        {renderDropdownContent(false)}
      </div>
    </div>
  );
};
