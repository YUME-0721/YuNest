/**
 * YuNest 全局数据管理上下文
 * NOTE: 所有数据通过 localStorage 持久化，纯客户端方案，适配静态部署
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  icon: string;
  description?: string;
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
  darkMask: boolean;
  searchEngine: string;
  githubToken?: string;
  githubRepo?: string; // 格式: owner/repo
}

export interface AppState {
  settings: Settings;
  categories: Category[];
}


/** 预设的搜索引擎列表 */
export const PRESET_SEARCH_ENGINES = [
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    icon: 'https://www.google.com/favicon.ico',
  },
  {
    id: 'bing',
    name: 'Bing',
    url: 'https://www.bing.com/search?q=',
    icon: 'https://www.bing.com/favicon.ico',
  },
  {
    id: 'baidu',
    name: 'Baidu',
    url: 'https://www.baidu.com/s?wd=',
    icon: 'https://www.baidu.com/favicon.ico',
  },
];

const defaultState: AppState = {
  settings: {
    siteName: 'YuNest',
    wallpaperType: 'color',
    wallpaperUrl: '',
    localWallpaper: '',
    backgroundColor: '#000000',
    glassEffect: true,
    darkMask: true,
    searchEngine: 'https://www.google.com/search?q=',
    githubToken: '',
    githubRepo: '',
  },
  categories: [
    {
      id: 'c1',
      title: '工具',
      icon: 'Wrench',
      bookmarks: [
        { id: 'b1', title: 'GitHub', url: 'https://github.com', description: '代码托管与协作', icon: 'Github' },
        { id: 'b2', title: 'Cloudflare', url: 'https://www.cloudflare.com', description: '静态托管与 CDN', icon: 'Cloud' },
        { id: 'b3', title: 'Spaceship', url: 'https://www.spaceship.com', description: '域名注册与管理', icon: 'Rocket' },
        { id: 'b4', title: 'Stitch', url: 'https://stitch.mongodb.com', description: '无服务器后端服务', icon: 'Cpu' },
        { id: 'b5', title: 'AI Studio', url: 'https://aistudio.google.com', description: 'Gemini AI 开发', icon: 'Sparkles' },
      ],
    },
  ],
};

interface DataContextType {
  state: AppState;
  updateSettings: (settings: Partial<Settings>) => void;
  addCategory: (category: Omit<Category, 'id' | 'bookmarks'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (fromIndex: number, toIndex: number) => void;
  addBookmark: (categoryId: string, bookmark: Omit<Bookmark, 'id'>) => void;
  updateBookmark: (categoryId: string, bookmarkId: string, bookmark: Partial<Bookmark>) => void;
  deleteBookmark: (categoryId: string, bookmarkId: string) => void;
  reorderBookmarks: (categoryId: string, fromIndex: number, toIndex: number) => void;
  importData: (data: AppState) => void;
  exportData: () => void;
  syncToRepo: (token?: string, repo?: string) => Promise<boolean>;
  fetchFromRepo: (token?: string, repo?: string) => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('yunest_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // NOTE: 兼容旧版数据结构，自动补全新增字段
        return {
          ...defaultState,
          ...parsed,
          settings: { ...defaultState.settings, ...parsed.settings },
          categories: (parsed.categories || []).map((c: any) => ({
            layout: 'card', 
            isHidden: false, // 默认旧数据为公开
            ...c
          }))
        };
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem('yunest_data', JSON.stringify(state));
  }, [state]);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...newSettings } }));
  }, []);

  const addCategory = useCallback((category: Omit<Category, 'id' | 'bookmarks'>) => {
    setState((prev) => ({
      ...prev,
      categories: [...prev.categories, { ...category, id: `c_${Date.now()}`, bookmarks: [] }],
    }));
  }, []);

  const updateCategory = useCallback((id: string, category: Partial<Category>) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, ...category } : c)),
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
  }, []);

  /** 分组排序——用于拖拽调整分组顺序 */
  const reorderCategories = useCallback((fromIndex: number, toIndex: number) => {
    setState((prev) => {
      const newCategories = [...prev.categories];
      const [moved] = newCategories.splice(fromIndex, 1);
      newCategories.splice(toIndex, 0, moved);
      return { ...prev, categories: newCategories };
    });
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
    }));
  }, []);

  const importData = useCallback((data: AppState) => {
    // NOTE: 导入时也兼容旧数据结构
    setState({
      ...defaultState,
      ...data,
      settings: { ...defaultState.settings, ...data.settings },
    });
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
    if (!token || !repo) throw new Error('缺少 GitHub Token 或 仓库名');

    const path = 'yunest_data.json';
    const branch = 'data';
    const stateToSave = { 
      ...state, 
      settings: { ...state.settings, githubToken: '', githubRepo: '' } 
    };

    // 1. 确保分支存在，如果不存在则尝试创建
    const branchRes = await fetch(`https://api.github.com/repos/${repo}/branches/${branch}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!branchRes.ok) {
      // 获取默认分支
      const repoRes = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!repoRes.ok) throw new Error('无法访问仓库，请检查 Token 和仓库名');
      const repoData = await repoRes.json();
      const defaultBranch = repoData.default_branch;

      // 获取默认分支最新的 SHA
      const latestRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${defaultBranch}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!latestRes.ok) throw new Error(`无法获取 ${defaultBranch} 分支状态`);
      const latestData = await latestRes.json();
      const latestSha = latestData.object.sha;

      // 创建 data 分支
      const createBranchRes = await fetch(`https://api.github.com/repos/${repo}/git/refs`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: `refs/heads/${branch}`,
          sha: latestSha
        })
      });
      if (!createBranchRes.ok) {
        const err = await createBranchRes.json().catch(() => ({}));
        throw new Error(err.message || '创建 data 分支失败');
      }
    }

    // 2. 获取现有文件的 SHA
    let sha = '';
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json'
      }
    });
    
    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    }

    // 3. 执行 PUT 请求
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
        branch: branch
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
    if (!token || !repo) throw new Error('缺少 GitHub Token 或 仓库名');

    const path = 'yunest_data.json';
    const branch = 'data';
    const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Cache-Control': 'no-cache',
      }
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || '从仓库拉取失败');
    }
    const data = await response.json();
    const content = decodeURIComponent(escape(atob(data.content)));
    const parsedData = JSON.parse(content);
    
    // 恢复本地凭证
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
        addBookmark,
        updateBookmark,
        deleteBookmark,
        reorderBookmarks,
        importData,
        exportData,
        syncToRepo,
        fetchFromRepo,
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
