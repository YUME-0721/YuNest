/**
 * YuNest 全局数据管理上下文
 * NOTE: 所有数据通过 localStorage 持久化，纯客户端方案，适配静态部署
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  lanUrl?: string; // 内网地址
  icon: string;
  description?: string;
  size?: '1x1' | '1x2' | '2x1' | '2x2';
  itemType?: 'link' | 'widget';
  widgetType?: string;
  widgetConfig?: any;
  showBackground?: boolean;
  wrapLine?: boolean;
}

export interface Category {
  id: string;
  title: string;
  icon: string;
  bookmarks: Bookmark[];
  layout?: 'card' | 'grid'; // 'card' 为展开卡片, 'grid' 为紧凑宫格
  isHidden?: boolean; // 是否为隐藏分组
}

/**
 * NOTE: wallpaperType 决定壁纸来源逻辑：
 * - 'fixed': 使用固定的图片 URL
 * - 'api': 使用随机图 API，每次刷新加载不同图片
 * - 'local': 使用本地上传的图片（base64 存储）
 */
export interface Settings {
  siteName: string;
  wallpaperType: 'fixed' | 'api' | 'local' | 'color';
  wallpaperUrl: string;
  localWallpaper: string;
  backgroundColor: string;
  glassEffect: boolean;
  glassEffectOpacity: number; // 0-100
  darkMask: boolean;
  darkMaskOpacity: number; // 0-100
  searchEngine: string;
  githubToken?: string;
  githubRepo?: string; // 格式: owner/repo
  language: 'zh-CN' | 'en-US';
  timezone: string; // 时区 ID (如 Asia/Shanghai)
  authRedirect?: boolean;
  autoSync?: boolean;
  githubSync?: boolean;
  widgetAlignment?: 'left' | 'center' | 'right';
  widgetBackground?: boolean; // 小组件是否显示白色半透明背景
}

export interface AppState {
  settings: Settings;
  categories: Category[];
  widgets: Bookmark[];
  updatedAt: number;
}


/** 预设的搜索引擎列表 */
export const PRESET_SEARCH_ENGINES = [
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    icon: '/icons/google.svg',
  },
  {
    id: 'bing',
    name: 'Bing',
    url: 'https://www.bing.com/search?q=',
    icon: '/icons/bing.ico',
  },
  {
    id: 'baidu',
    name: 'Baidu',
    url: 'https://www.baidu.com/s?wd=',
    icon: '/icons/baidu.ico',
  },
];

/** 默认个性化设置 */
export const DEFAULT_SETTINGS: Settings = {
  siteName: 'YuNest',
  wallpaperType: 'fixed',
  wallpaperUrl: 'https://img.072199.xyz/file/wallpaper/1773289345749.webp',
  localWallpaper: '',
  backgroundColor: '#000000',
  glassEffect: true,
  glassEffectOpacity: 60,
  darkMask: true,
  darkMaskOpacity: 50,
  searchEngine: 'https://www.google.com/search?q=',
  githubToken: '',
  githubRepo: '',
  language: 'zh-CN',
  timezone: '', // 默认为空，跟随系统
  authRedirect: true,
  autoSync: true,
  githubSync: true,
  widgetAlignment: 'center',
  widgetBackground: false,
};

const defaultState: AppState = {
  settings: DEFAULT_SETTINGS,
  categories: [],
  widgets: [],
  updatedAt: 0,
};

interface DataContextType {
  state: AppState;
  updateSettings: (settings: Partial<Settings>) => void;
  addCategory: (category: Omit<Category, 'id' | 'bookmarks'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (fromIndex: number, toIndex: number) => void;
  setCategoriesOrder: (newCategories: Category[]) => void;
  addBookmark: (categoryId: string, bookmark: Omit<Bookmark, 'id'>) => void;
  updateBookmark: (categoryId: string, bookmarkId: string, bookmark: Partial<Bookmark>) => void;
  deleteBookmark: (categoryId: string, bookmarkId: string) => void;
  reorderBookmarks: (categoryId: string, fromIndex: number, toIndex: number) => void;
  setBookmarksOrder: (categoryId: string, newBookmarks: Bookmark[]) => void;
  addWidget: (widget: Omit<Bookmark, 'id'>) => void;
  updateWidget: (widgetId: string, widget: Partial<Bookmark>) => void;
  deleteWidget: (widgetId: string) => void;
  reorderWidgets: (fromIndex: number, toIndex: number) => void;
  importData: (data: AppState) => void;
  exportData: () => void;
  syncToRepo: (token?: string, repo?: string) => Promise<boolean>;
  fetchFromRepo: (token?: string, repo?: string) => Promise<boolean>;
  isReady: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('yunest_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const extractedWidgets: Bookmark[] = parsed.widgets || [];
        const cleanedCategories = (parsed.categories || []).map((c: any) => {
          const cWidgets = (c.bookmarks || []).filter((b: any) => b.itemType === 'widget');
          extractedWidgets.push(...cWidgets);
          return {
            layout: 'card', 
            isHidden: false, // 默认旧数据为公开
            ...c,
            bookmarks: (c.bookmarks || []).filter((b: any) => b.itemType !== 'widget')
          };
        });

        // NOTE: 兼容旧版数据结构，自动补全新增字段
        return {
          ...defaultState,
          ...parsed,
          settings: { 
            ...defaultState.settings, 
            ...parsed.settings,
            githubToken: parsed.settings?.githubToken || '',
            githubRepo: parsed.settings?.githubRepo || ''
          },
          widgets: extractedWidgets,
          categories: cleanedCategories
        };
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
    return defaultState;
  });

  // 1. 自动同步逻辑：初始化与增量更新
  useEffect(() => {
    const initializeData = async () => {
      let currentUpdatedAt = state.updatedAt;

      // 1. 先尝试加载内置默认数据 (用于初次部署或代码更新后的数据同步)
      try {
        const res = await fetch(`/data/default_data.json?t=${Date.now()}`, { 
          cache: 'no-store',
          headers: { 
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        if (res.ok) {
          const defaultData = await res.json();
          const hasLocalData = localStorage.getItem('yunest_data');
          
          // 如果没有本地数据，或者内置数据的 updatedAt 比较新，则加载
          if (!hasLocalData || (defaultData.updatedAt && defaultData.updatedAt > currentUpdatedAt)) {
            console.log('YuNest: 加载项目内置默认数据 (发现更新或初次加载)');
            importData(defaultData);
            currentUpdatedAt = defaultData.updatedAt || Date.now();
          }
        }
      } catch (e) {
        console.warn('Failed to load default_data.json', e);
      }

      // 2. 如果开启了同步，尝试从云端拉取更新 (优先通过服务端加密代理 /api/sync)
      if (state.settings.githubSync && state.settings.autoSync) {
        let synced = false;

        // 2.1 尝试通过边缘代理 /api/sync 拉取
        try {
          const authPassword = sessionStorage.getItem('yunest_admin_pwd') || '';
          const proxyRes = await fetch('/api/sync', {
            headers: {
              'x-auth-password': authPassword,
            },
          });

          if (proxyRes.ok) {
            const remoteData = (await proxyRes.json()) as AppState;
            if (remoteData.updatedAt && remoteData.updatedAt > currentUpdatedAt) {
              console.log('YuNest: (边缘代理) 发现云端有更新，正在同步...');
              importData(remoteData);
              synced = true;
            } else {
              console.log('YuNest: (边缘代理) 本地数据已是最新');
              synced = true;
            }
          }
        } catch (proxyErr) {
          // 代理不可用或未配置，尝试降级
        }

        // 2.2 降级方案：客户端直接调用 GitHub API (使用本地输入的 Token)
        if (!synced && state.settings.githubToken && state.settings.githubRepo) {
          try {
            const token = state.settings.githubToken;
            const repo = state.settings.githubRepo;
            const path = 'data/yunest_data.json';
            
            // GitHub API 不允许自定义 Cache-Control 等 Header，否则会触发 CORS 预检失败
            const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
              cache: 'no-store',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
              }
            });

            if (response.ok) {
              const data = await response.json();
              const content = decodeURIComponent(escape(atob(data.content)));
              const remoteData = JSON.parse(content) as AppState;
              
              if (remoteData.updatedAt && remoteData.updatedAt > currentUpdatedAt) {
                console.log('YuNest: (客户端直连) 发现云端有更新，正在同步...');
                remoteData.settings.githubToken = token;
                remoteData.settings.githubRepo = repo;
                importData(remoteData);
              } else {
                console.log('YuNest: (客户端直连) 本地数据已是最新');
              }
            }
          } catch (err) {
            console.warn('Auto sync check failed:', err);
          }
        }
      }
    };

    initializeData().finally(() => {
      setIsReady(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.settings.githubSync, state.settings.autoSync]);

  // 2. 状态持久化到本地（放在同步逻辑后，避免初次加载时过早写入空数据）
  useEffect(() => {
    if (isReady) {
      localStorage.setItem('yunest_data', JSON.stringify(state));
    }
  }, [state, isReady]);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setState((prev) => ({ 
      ...prev, 
      settings: { ...prev.settings, ...newSettings },
      updatedAt: Date.now() 
    }));
  }, []);

  const addCategory = useCallback((category: Omit<Category, 'id' | 'bookmarks'>) => {
    setState((prev) => ({
      ...prev,
      categories: [...prev.categories, { ...category, id: `c_${Date.now()}`, bookmarks: [] }],
      updatedAt: Date.now()
    }));
  }, []);

  const updateCategory = useCallback((id: string, category: Partial<Category>) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, ...category } : c)),
      updatedAt: Date.now()
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
      updatedAt: Date.now()
    }));
  }, []);

  /** 分组排序——用于拖拽调整分组顺序 */
  const reorderCategories = useCallback((fromIndex: number, toIndex: number) => {
    setState((prev) => {
      const newCategories = [...prev.categories];
      const [moved] = newCategories.splice(fromIndex, 1);
      newCategories.splice(toIndex, 0, moved);
      return { ...prev, categories: newCategories, updatedAt: Date.now() };
    });
  }, []);

  /** 分组批量排序——用于流畅拖动吸附重排 */
  const setCategoriesOrder = useCallback((newCategories: Category[]) => {
    setState((prev) => ({
      ...prev,
      categories: newCategories,
      updatedAt: Date.now()
    }));
  }, []);

  const addBookmark = useCallback((categoryId: string, bookmark: Omit<Bookmark, 'id'>) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => {
        if (c.id === categoryId) {
          return { ...c, bookmarks: [...c.bookmarks, { ...bookmark, id: `b_${Date.now()}` }] };
        }
        return c;
      }),
      updatedAt: Date.now()
    }));
  }, []);

  const updateBookmark = useCallback((categoryId: string, bookmarkId: string, bookmark: Partial<Bookmark>) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => {
        if (c.id === categoryId) {
          return {
            ...c,
            bookmarks: c.bookmarks.map((b) => (b.id === bookmarkId ? { ...b, ...bookmark } : b)),
          };
        }
        return c;
      }),
      updatedAt: Date.now()
    }));
  }, []);

  const deleteBookmark = useCallback((categoryId: string, bookmarkId: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => {
        if (c.id === categoryId) {
          return { ...c, bookmarks: c.bookmarks.filter((b) => b.id !== bookmarkId) };
        }
        return c;
      }),
      updatedAt: Date.now()
    }));
  }, []);

  /** 书签排序——用于拖拽调整站点顺序 */
  const reorderBookmarks = useCallback((categoryId: string, fromIndex: number, toIndex: number) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => {
        if (c.id === categoryId) {
          const newBookmarks = [...c.bookmarks];
          const [moved] = newBookmarks.splice(fromIndex, 1);
          newBookmarks.splice(toIndex, 0, moved);
          return { ...c, bookmarks: newBookmarks };
        }
        return c;
      }),
      updatedAt: Date.now()
    }));
  }, []);

  /** 书签批量排序——用于流畅拖动吸附重排 */
  const setBookmarksOrder = useCallback((categoryId: string, newBookmarks: Bookmark[]) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => {
        if (c.id === categoryId) {
          return { ...c, bookmarks: newBookmarks };
        }
        return c;
      }),
      updatedAt: Date.now()
    }));
  }, []);

  const addWidget = useCallback((widget: Omit<Bookmark, 'id'>) => {
    setState((prev) => ({
      ...prev,
      widgets: [...prev.widgets, { ...widget, id: `w_${Date.now()}` }],
      updatedAt: Date.now()
    }));
  }, []);

  const updateWidget = useCallback((widgetId: string, widget: Partial<Bookmark>) => {
    setState((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) => (w.id === widgetId ? { ...w, ...widget } : w)),
      updatedAt: Date.now()
    }));
  }, []);

  const deleteWidget = useCallback((widgetId: string) => {
    setState((prev) => ({
      ...prev,
      widgets: prev.widgets.filter((w) => w.id !== widgetId),
      updatedAt: Date.now()
    }));
  }, []);

  const reorderWidgets = useCallback((fromIndex: number, toIndex: number) => {
    setState((prev) => {
      const newWidgets = [...prev.widgets];
      const [moved] = newWidgets.splice(fromIndex, 1);
      newWidgets.splice(toIndex, 0, moved);
      return { ...prev, widgets: newWidgets, updatedAt: Date.now() };
    });
  }, []);

  const importData = useCallback((data: AppState) => {
    setState((prev) => ({
      ...defaultState,
      ...data,
      settings: { ...defaultState.settings, ...data.settings },
      // 如果导入的数据没有 updatedAt，则设为当前时间
      updatedAt: data.updatedAt || Date.now()
    }));
  }, []);

  const exportData = useCallback(() => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `yunest-backup-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [state]);

  const syncToRepo = useCallback(async (tokenOverride?: string, repoOverride?: string) => {
    const token = tokenOverride || state.settings.githubToken;
    const repo = repoOverride || state.settings.githubRepo;
    const authPassword = sessionStorage.getItem('yunest_admin_pwd') || '';

    // 1. 优先尝试通过服务端边缘代理 /api/sync 推送 (安全免 Token 暴露)
    try {
      const proxyRes = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-password': authPassword,
        },
        body: JSON.stringify(state),
      });

      if (proxyRes.ok) {
        return true;
      }

      // 如果是服务端未配置或者 404 (非边缘部署环境)，转入客户端降级直连
      const errData = await proxyRes.json().catch(() => ({}));
      if (errData.code !== 'NOT_CONFIGURED' && proxyRes.status !== 404 && proxyRes.status !== 405) {
        throw new Error(errData.error || '云端代理同步失败');
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch') && !e.message.includes('NOT_CONFIGURED')) {
        throw e;
      }
    }

    // 2. 降级方案：客户端直接调用 GitHub API
    if (!token || !repo) {
      throw new Error('未检测到云端代理配置，请在下方手动填写 GitHub Token 和仓库名');
    }

    const path = 'data/yunest_data.json';
    const branch = 'main'; 
    const stateToSave = { 
      ...state, 
      settings: { ...state.settings, githubToken: '', githubRepo: '' } 
    };

    // 2.1 获取现有文件的 SHA
    let sha = '';
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json'
      }
    });
    
    let actualBranch = branch;
    if (!getRes.ok && getRes.status === 404) {
      const masterRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=master`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json'
        }
      });
      if (masterRes.ok) {
        const existingMaster = await masterRes.json();
        sha = existingMaster.sha;
        actualBranch = 'master';
      }
    } else if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    }

    // 2.2 执行 PUT 请求
    const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json'
      },
      body: JSON.stringify({
        message: 'YuNest Data Sync',
        content: btoa(unescape(encodeURIComponent(JSON.stringify(stateToSave, null, 2)))),
        sha: sha || undefined,
        branch: actualBranch
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || '同步到仓库失败');
    }
    return true;
  }, [state]);

  const fetchFromRepo = useCallback(async (tokenOverride?: string, repoOverride?: string) => {
    const token = tokenOverride || state.settings.githubToken;
    const repo = repoOverride || state.settings.githubRepo;
    const authPassword = sessionStorage.getItem('yunest_admin_pwd') || '';

    // 1. 优先尝试从服务端边缘代理 /api/sync 拉取
    try {
      const proxyRes = await fetch('/api/sync', {
        headers: {
          'x-auth-password': authPassword,
        },
      });

      if (proxyRes.ok) {
        const remoteData = (await proxyRes.json()) as AppState;
        importData(remoteData);
        return true;
      }

      const errData = await proxyRes.json().catch(() => ({}));
      if (errData.code !== 'NOT_CONFIGURED' && proxyRes.status !== 404 && proxyRes.status !== 405) {
        throw new Error(errData.error || '云端代理拉取失败');
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch') && !e.message.includes('NOT_CONFIGURED')) {
        throw e;
      }
    }

    // 2. 降级方案：客户端直接调用 GitHub API
    if (!token || !repo) {
      throw new Error('未检测到云端代理配置，请在下方手动填写 GitHub Token 和仓库名');
    }

    const path = 'data/yunest_data.json';
    const oldPath = 'yunest_data.json';
    
    let response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
      }
    });

    if (!response.ok && response.status === 404) {
      response = await fetch(`https://api.github.com/repos/${repo}/contents/${oldPath}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
        }
      });
    }

    if (!response.ok && response.status === 404) {
      response = await fetch(`https://api.github.com/repos/${repo}/contents/${oldPath}?ref=data`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
        }
      });
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || '从仓库拉取失败');
    }

    const data = await response.json();
    const content = decodeURIComponent(escape(atob(data.content)));
    const parsedData = JSON.parse(content);
    
    if (!parsedData.settings) parsedData.settings = {};
    parsedData.settings.githubToken = token;
    parsedData.settings.githubRepo = repo;
    
    importData(parsedData);
    return true;
  }, [importData, state.settings.githubToken, state.settings.githubRepo]);

  return (
    <DataContext.Provider
      value={{
        state,
        updateSettings,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        setCategoriesOrder,
        addBookmark,
        updateBookmark,
        deleteBookmark,
        reorderBookmarks,
        setBookmarksOrder,
        addWidget,
        updateWidget,
        deleteWidget,
        reorderWidgets,
        importData,
        exportData,
        syncToRepo,
        fetchFromRepo,
        isReady,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
