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
    wallpaperType: 'api',
    wallpaperUrl: '',
    localWallpaper: '',
    backgroundColor: '#0a0a0a',
    glassEffect: true,
    darkMask: true,
    searchEngine: 'https://www.google.com/search?q=',
  },
  categories: [
    {
      id: 'c1',
      title: '办公效率',
      icon: 'Briefcase',
      bookmarks: [
        { id: 'b1', title: 'Gmail', url: 'https://mail.google.com', description: '邮件通讯', icon: 'Mail' },
        { id: 'b2', title: 'Notion', url: 'https://notion.so', description: '协作空间', icon: 'FileText' },
      ],
    },
    {
      id: 'c2',
      title: '社交娱乐',
      icon: 'Coffee',
      bookmarks: [
        { id: 'b3', title: 'Twitter', url: 'https://twitter.com', description: '资讯网络', icon: 'Twitter' },
        { id: 'b4', title: 'YouTube', url: 'https://youtube.com', description: '视频影音', icon: 'Youtube' },
      ],
    },
    {
      id: 'c3',
      title: '开发者工具',
      icon: 'Code',
      bookmarks: [
        { id: 'b5', title: 'GitHub', url: 'https://github.com', description: '代码托管', icon: 'Github' },
        { id: 'b6', title: 'StackOverflow', url: 'https://stackoverflow.com', description: '技术社区', icon: 'Layers' },
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
