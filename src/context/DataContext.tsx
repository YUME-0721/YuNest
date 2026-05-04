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
}

export interface AppState {
  settings: Settings;
  categories: Category[];
  updatedAt: number;
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

// 从环境变量读取默认同步配置
const envGithubToken = (import.meta as any).env.VITE_GITHUB_TOKEN || '';
const envGithubRepo = (import.meta as any).env.VITE_GITHUB_REPO || '';

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
  githubToken: envGithubToken,
  githubRepo: envGithubRepo,
  language: 'zh-CN',
  timezone: '', // 默认为空，跟随系统
  authRedirect: true,
  autoSync: false,
  githubSync: false,
};

const defaultState: AppState = {
  settings: DEFAULT_SETTINGS,
  categories: [
    {
      id: 'c1',
      title: '工具',
      icon: 'Wrench',
      layout: 'grid',
      isHidden: false,
      bookmarks: [
        { id: 'b1', title: 'GitHub', url: 'https://github.com', description: '代码托管与协作', icon: '' },
        { id: 'b2', title: 'Cloudflare', url: 'https://www.cloudflare.com', description: '静态托管与 CDN', icon: '' },
        { id: 'b3', title: 'Google', url: 'https://www.google.com', description: '谷歌搜索', icon: '' },
        { id: 'b4', title: 'Microsoft', url: 'https://www.microsoft.com', description: '微软官网', icon: '' },
        { id: 'b5', title: 'Apple', url: 'https://www.apple.com', description: '苹果官网', icon: '' },
        { id: 'b6', title: 'Vercel', url: 'https://vercel.com', description: '前端部署平台', icon: '' },
        { id: 'b7', title: 'Railway', url: 'https://railway.app', description: '后端托管服务', icon: '' },
        { id: 'b8', title: 'Supabase', url: 'https://supabase.com', description: '开源 Firebase 替代品', icon: '' },
        { id: 'b9', title: 'ChatGPT', url: 'https://chat.openai.com', description: 'OpenAI 智能会话', icon: '' },
        { id: 'b10', title: 'Claude', url: 'https://claude.ai', description: 'Anthropic 智能助手', icon: '' },
        { id: 'b11', title: 'Hugging Face', url: 'https://huggingface.co', description: 'AI 开源模型协作平台', icon: '' },
        { id: 'b12', title: 'Tailwind CSS', url: 'https://tailwindcss.com', description: '现代 CSS 样式框架', icon: '' },
      ],
    },
    {
      id: 'c2',
      title: '休闲娱乐',
      icon: 'Gamepad2',
      layout: 'card',
      isHidden: false,
      bookmarks: [
        { id: 'b13', title: 'YouTube', url: 'https://www.youtube.com', description: '全球视频分享平台', icon: '' },
        { id: 'b14', title: 'Facebook', url: 'https://www.facebook.com', description: '社交网络', icon: '' },
        { id: 'b15', title: 'Twitter', url: 'https://twitter.com', description: '社交媒体 X', icon: '' },
        { id: 'b16', title: 'Bilibili', url: 'https://www.bilibili.com', description: '中国最大的弹幕视频平台', icon: '' },
        { id: 'b17', title: 'Pixiv', url: 'https://www.pixiv.net', description: '插画艺术交流网站', icon: '' },
        { id: 'b18', title: 'TMDB', url: 'https://www.themoviedb.org', description: '电影与电视数据库', icon: '' },
        { id: 'b19', title: 'TVDB', url: 'https://thetvdb.com', description: '电视节目数据库', icon: '' },
        { id: 'b20', title: 'IMDb', url: 'https://www.imdb.com', description: '互联网电影资料库', icon: '' },
        { id: 'b21', title: 'Bangumi', url: 'https://bgm.tv', description: '动漫番剧索引与记录', icon: '' },
        { id: 'b22', title: 'Douban', url: 'https://www.douban.com', description: '书影音评分与记录', icon: '' },
      ],
    },
  ],
  updatedAt: 0,
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
          settings: { 
            ...defaultState.settings, 
            ...parsed.settings,
            // 如果本地没存过 token/repo 但环境变量里有，则使用环境变量的
            githubToken: parsed.settings?.githubToken || envGithubToken,
            githubRepo: parsed.settings?.githubRepo || envGithubRepo
          },
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

  // 1. 自动同步逻辑：页面加载或开关开启时检查云端更新
  useEffect(() => {
    if (state.settings.githubSync && state.settings.autoSync && state.settings.githubToken && state.settings.githubRepo) {
      const checkAndPull = async () => {
        try {
          const token = state.settings.githubToken;
          const repo = state.settings.githubRepo;
          const path = 'data/yunest_data.json';
          
          const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github+json',
            }
          });

          if (response.ok) {
            const data = await response.json();
            const content = decodeURIComponent(escape(atob(data.content)));
            const remoteData = JSON.parse(content) as AppState;
            
            if (remoteData.updatedAt && remoteData.updatedAt > state.updatedAt) {
              console.log('YuNest: 发现云端有更新，正在自动同步...');
              remoteData.settings.githubToken = token;
              remoteData.settings.githubRepo = repo;
              importData(remoteData);
            }
          }
        } catch (err) {
          console.warn('Auto sync check failed:', err);
        }
      };
      checkAndPull();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.settings.githubSync, state.settings.autoSync]);

  // 2. 状态持久化到本地（放在同步逻辑后，避免初次加载时过早写入空数据）
  useEffect(() => {
    localStorage.setItem('yunest_data', JSON.stringify(state));
  }, [state]);

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
    if (!token || !repo) throw new Error('缺少 GitHub Token 或 仓库名');

    const path = 'data/yunest_data.json';
    // 默认推送到 main 分支，配合 Cloudflare Ignore Paths 使用效果最佳
    const branch = 'main'; 
    const stateToSave = { 
      ...state, 
      settings: { ...state.settings, githubToken: '', githubRepo: '' } 
    };

    // 1. 获取现有文件的 SHA (如果文件已存在)
    let sha = '';
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json'
      }
    });
    
    // 如果 main 失败，尝试 master
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
    if (!token || !repo) throw new Error('缺少 GitHub Token 或 仓库名');

    const path = 'data/yunest_data.json';
    const oldPath = 'yunest_data.json';
    
    // 1. 优先尝试从 main 分支的 data/ 目录下读取
    let response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
      }
    });

    // 2. 如果不存在，尝试从根目录读取（兼容旧版本）
    if (!response.ok && response.status === 404) {
      response = await fetch(`https://api.github.com/repos/${repo}/contents/${oldPath}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
        }
      });
    }

    // 3. 如果还是不存在，尝试从 data 分支读取（兼容上一版设计）
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
    
    // 恢复本地凭证，确保同步配置不丢失
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
