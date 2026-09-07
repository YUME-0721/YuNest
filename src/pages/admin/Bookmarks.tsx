/**
 * 书签目录管理页面
 * NOTE: 支持分组的 CRUD 和站点的 CRUD，包含分类和书签的模态框编辑
 */

import React, { useState, useRef } from 'react';
import { useData, type Category, type Bookmark } from '../../context/DataContext.tsx';
import * as Icons from 'lucide-react';
import { Plus, Edit2, Trash2, FolderOpen, LayoutGrid, LayoutList, Eye, EyeOff, Lock, Globe, GripVertical, HelpCircle } from 'lucide-react';
import { Reorder, useDragControls } from 'motion/react';
import { TRANSLATIONS } from '../../i18n/translations.ts';
import ConfirmModal from '../../components/ConfirmModal.tsx';
import { getFaviconProxyUrl, normalizeIconUrl, isTransparentPlaceholder } from '../../lib/favicon.ts';

function CategoryTabItem({
  category,
  isActive,
  onSelect,
  onDragEnd,
}: {
  key?: string;
  category: Category;
  isActive: boolean;
  onSelect: () => void;
  onDragEnd: () => void;
}) {
  const dragControls = useDragControls();
  const timerRef = useRef<any>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    startPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;

    timerRef.current = setTimeout(() => {
      isDraggingRef.current = true;
      dragControls.start(e);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
      }
    }, 220);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startPosRef.current || isDraggingRef.current) return;
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    if (dx > 8 || dy > 8) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!isDraggingRef.current) {
      onSelect();
    }
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  const handlePointerCancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isDraggingRef.current = false;
  };

  return (
    <Reorder.Item
      value={category}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      className="relative select-none flex-shrink-0 touch-pan-x h-10 box-border cursor-pointer"
      transition={{
        type: 'spring',
        damping: 30,
        stiffness: 400
      }}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className={`flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-sm font-semibold border-2 transition-colors duration-150 group select-none box-border ${
          isActive
            ? 'border-[#ec5b13] bg-[#ec5b13]/10 text-[#ec5b13] shadow-sm'
            : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 bg-white/70 shadow-xs'
        }`}
      >
        <GripVertical
          className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => {
            e.stopPropagation();
            isDraggingRef.current = true;
            dragControls.start(e);
          }}
        />
        <span className="whitespace-nowrap leading-none flex items-center">{category.title}</span>
        <span
          className={`h-5 min-w-[20px] px-1.5 inline-flex items-center justify-center text-xs font-semibold leading-none rounded-full transition-colors ml-0.5 ${
            isActive ? 'bg-[#ec5b13]/20 text-[#ec5b13]' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
          }`}
        >
          {category.bookmarks.length}
        </span>
      </div>
    </Reorder.Item>
  );
}

function CategoryTabsReorderList({
  categories,
  activeCategory,
  onSelectCategory,
  onSaveOrder,
}: {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (id: string) => void;
  onSaveOrder: (newCategories: Category[]) => void;
}) {
  const [items, setItems] = React.useState<Category[]>(categories);
  const itemsRef = useRef<Category[]>(categories);
  itemsRef.current = items;

  React.useEffect(() => {
    setItems(categories);
  }, [categories]);

  const handleReorder = (newItems: Category[]) => {
    setItems(newItems);
    itemsRef.current = newItems;
  };

  const handleDragEnd = () => {
    onSaveOrder(itemsRef.current);
  };

  return (
    <Reorder.Group
      axis="x"
      values={items}
      onReorder={handleReorder}
      className="flex items-center gap-1.5 min-w-max"
    >
      {items.map((category) => (
        <CategoryTabItem
          key={category.id}
          category={category}
          isActive={activeCategory === category.id}
          onSelect={() => onSelectCategory(category.id)}
          onDragEnd={handleDragEnd}
        />
      ))}
    </Reorder.Group>
  );
}

interface BookmarkRowItemProps {
  key?: string;
  bookmark: Bookmark;
  renderIcon: (iconName: string, siteUrl?: string, size?: string) => React.ReactNode;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onDragEnd: () => void;
}

function BookmarkRowItem({ bookmark, renderIcon, onEdit, onDelete, onDragEnd }: BookmarkRowItemProps) {
  const dragControls = useDragControls();
  const timerRef = useRef<any>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input')) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    startPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;

    timerRef.current = setTimeout(() => {
      isDraggingRef.current = true;
      dragControls.start(e);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
      }
    }, 220);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startPosRef.current || isDraggingRef.current) return;
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    if (dx > 8 || dy > 8) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  const handlePointerCancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isDraggingRef.current = false;
  };

  return (
    <Reorder.Item
      value={bookmark}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      className="relative select-none group touch-pan-y rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/90 shadow-xs"
      transition={{
        type: 'spring',
        damping: 30,
        stiffness: 400
      }}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="flex items-center justify-between p-3.5"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div
            className="p-1 text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing hover:bg-slate-100 rounded-md transition-colors flex-shrink-0"
            onPointerDown={(e) => {
              e.stopPropagation();
              isDraggingRef.current = true;
              dragControls.start(e);
            }}
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="w-10 h-10 rounded-xl bg-slate-100/80 border border-slate-200/50 flex items-center justify-center overflow-hidden text-slate-500 flex-shrink-0">
            {renderIcon(bookmark.icon, bookmark.url, 'w-6 h-6')}
          </div>

          <div className="min-w-0 flex-1 pr-2">
            <div className="font-semibold text-slate-900 truncate text-sm sm:text-base">
              {bookmark.title}
            </div>
            {bookmark.url && (
              <div className="text-xs text-slate-400 truncate mt-0.5 max-w-md">
                {bookmark.url}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(bookmark)}
            className="p-2 rounded-lg text-slate-400 hover:text-[#ec5b13] hover:bg-[#ec5b13]/5 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(bookmark)}
            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Reorder.Item>
  );
}

function BookmarksReorderList({
  categoryId,
  bookmarks,
  onSaveOrder,
  renderIcon,
  onEdit,
  onDelete,
}: {
  categoryId: string;
  bookmarks: Bookmark[];
  onSaveOrder: (categoryId: string, newBookmarks: Bookmark[]) => void;
  renderIcon: (iconName: string, siteUrl?: string, size?: string) => React.ReactNode;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
}) {
  const [items, setItems] = React.useState<Bookmark[]>(bookmarks);
  const itemsRef = useRef<Bookmark[]>(bookmarks);
  itemsRef.current = items;

  React.useEffect(() => {
    setItems(bookmarks);
  }, [bookmarks]);

  const handleReorder = (newItems: Bookmark[]) => {
    setItems(newItems);
    itemsRef.current = newItems;
  };

  const handleDragEnd = () => {
    onSaveOrder(categoryId, itemsRef.current);
  };

  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={handleReorder}
      className="flex flex-col gap-2"
    >
      {items.map((bookmark) => (
        <BookmarkRowItem
          key={bookmark.id}
          bookmark={bookmark}
          renderIcon={renderIcon}
          onEdit={onEdit}
          onDelete={onDelete}
          onDragEnd={handleDragEnd}
        />
      ))}
    </Reorder.Group>
  );
}

export default function Bookmarks() {
  const {
    state,
    addCategory,
    updateCategory,
    deleteCategory,
    setCategoriesOrder,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    setBookmarksOrder,
  } = useData();
  const t = TRANSLATIONS[state.settings.language || 'zh-CN'];
  const [activeCategory, setActiveCategory] = useState<string>(state.categories[0]?.id || '');

  // 分类模态框状态
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<{ title: string; icon: string; layout: 'card' | 'grid'; isHidden: boolean }>({
    title: '',
    icon: 'Folder',
    layout: 'card',
    isHidden: false
  });

  // 书签模态框状态
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [bookmarkForm, setBookmarkForm] = useState<{ title: string; url: string; lanUrl: string; icon: string; description: string; }>({ title: '', url: '', lanUrl: '', icon: '', description: '' });

  // 确认弹窗状态
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'warning'
  });

  const currentCategory = state.categories.find((c) => c.id === activeCategory);

  // 分类处理器
  const handleSaveCategory = () => {
    if (!categoryForm.title) return;
    if (editingCategory) {
      updateCategory(editingCategory.id, categoryForm);
    } else {
      addCategory(categoryForm);
    }
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    setCategoryForm({ title: '', icon: 'Folder', layout: 'card', isHidden: false });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      title: category.title,
      icon: category.icon,
      layout: category.layout || 'card',
      isHidden: category.isHidden || false
    });
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: t.deleteCategory,
      message: t.confirmDeleteCategory,
      type: 'danger',
      onConfirm: () => {
        deleteCategory(id);
        const remaining = state.categories.filter((c) => c.id !== id);
        setActiveCategory(remaining[0]?.id || '');
      }
    });
  };

  // 书签处理器
  const handleSaveBookmark = () => {
    if (!bookmarkForm.title || !activeCategory || !bookmarkForm.url) return;
    
    const finalForm = { ...bookmarkForm, itemType: 'link' } as any;
    // 未填图标时自动补全为代理 URL，直接存代理格式（/api/icon-proxy?host=xxx）
    if (!finalForm.icon && finalForm.url) {
      finalForm.icon = getFaviconProxyUrl(finalForm.url);
    }

    if (editingBookmark) {
      updateBookmark(activeCategory, editingBookmark.id, finalForm);
    } else {
      addBookmark(activeCategory, finalForm);
    }
    setIsBookmarkModalOpen(false);
    setEditingBookmark(null);
    setBookmarkForm({ title: '', url: '', lanUrl: '', icon: '', description: '' });
  };

  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setBookmarkForm({
      title: bookmark.title,
      url: bookmark.url || '',
      lanUrl: bookmark.lanUrl || '',
      icon: bookmark.icon || '',
      description: bookmark.description || '',
    });
    setIsBookmarkModalOpen(true);
  };



  /** 渲染预览图标（统一走代理） */
  const renderItemIcon = (iconName: string, siteUrl?: string, size: string = 'w-5 h-5') => {
    // 1. URL 图片（先规范化已知被墙 URL）
    if (iconName && (iconName.startsWith('http://') || iconName.startsWith('https://') || iconName.startsWith('/') || iconName.startsWith('data:'))) {
      const src = normalizeIconUrl(iconName);
      const isProxyUrl = src.startsWith('/api/icon-proxy');
      return (
        <img
          src={src}
          className={`${size} object-contain rounded-sm`}
          alt="icon"
          onLoad={(e) => {
            if (isTransparentPlaceholder(e.target as HTMLImageElement)) {
              (e.target as HTMLImageElement).style.display = 'none';
            }
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!isProxyUrl && !target.getAttribute('data-retried') && siteUrl) {
              const fav = getFaviconProxyUrl(siteUrl);
              if (fav) {
                target.setAttribute('data-retried', 'true');
                target.src = fav;
                return;
              }
            }
            target.style.display = 'none';
          }}
        />
      );
    }

    // 2. Lucide 图标
    const IconComponent = (Icons as any)[iconName];
    if (IconComponent) return <IconComponent className={size} />;

    // 3. 自动 Favicon（通过代理）
    if (siteUrl) {
      return (
        <img
          src={getFaviconProxyUrl(siteUrl)}
          className={`${size} object-contain rounded-sm`}
          alt="favicon"
          onLoad={(e) => {
            if (isTransparentPlaceholder(e.target as HTMLImageElement)) {
              (e.target as HTMLImageElement).style.display = 'none';
            }
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      );
    }

    // 4. 默认图标
    return <Globe className={size} />;
  };

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-extrabold tracking-tight">{t.bookmarksTitle}</h2>
            <div className="relative group flex items-center">
              <div
                className="p-1 rounded-full text-slate-400 hover:text-[#ec5b13] hover:bg-[#ec5b13]/10 transition-colors cursor-help"
                title={t.dragToReorderTip}
              >
                <HelpCircle className="w-5 h-5" />
              </div>
              {/* Tooltip 气泡 */}
              <div className="absolute left-0 top-full mt-1.5 hidden group-hover:flex items-center px-3 py-1.5 bg-slate-900/90 text-white text-xs font-medium rounded-xl whitespace-nowrap shadow-xl backdrop-blur-sm z-50 pointer-events-none transition-all">
                {t.dragToReorderTip}
              </div>
            </div>
          </div>
          <p className="text-slate-500">{t.bookmarksDesc}</p>
        </div>
      </div>

      {/* 分类标签页（长按/拖拽吸附排序） */}
      {state.categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-3 px-1.5 -my-2 scrollbar-none">
          <CategoryTabsReorderList
            categories={state.categories}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            onSaveOrder={setCategoriesOrder}
          />

          <button
            onClick={() => {
              setEditingCategory(null);
              setCategoryForm({ title: '', icon: 'Folder', layout: 'card', isHidden: false });
              setIsCategoryModalOpen(true);
            }}
            className="h-10 box-border px-3.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-[#ec5b13] hover:bg-[#ec5b13]/5 border border-dashed border-slate-300 hover:border-[#ec5b13] inline-flex items-center gap-1.5 transition-all whitespace-nowrap flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t.addCategory}
          </button>
        </div>
      )}

      {/* 当前分类的书签列表 */}
      {currentCategory && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* 分类标题栏 */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 flex-wrap">
              <FolderOpen className="w-5 h-5 text-[#ec5b13]" />
              {currentCategory.title}
              {currentCategory.isHidden && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[10px] font-bold">
                  <Lock className="w-2.5 h-2.5" />
                  {t.visibilityHidden.match(/\(([^)]+)\)/)?.[1] || 'Hidden'}
                </span>
              )}
              <div className="flex items-center gap-1 ml-2 border-l border-slate-200 pl-3">
                <button
                  onClick={() => handleEditCategory(currentCategory)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-[#ec5b13] hover:bg-[#ec5b13]/5 transition-all"
                  title={t.editCategory}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(currentCategory.id)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  title={t.deleteCategory}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </h3>
            <button
              id="add-bookmark-btn"
              onClick={() => {
                setEditingBookmark(null);
                setBookmarkForm({ title: '', url: '', lanUrl: '', icon: '', description: '' });
                setIsBookmarkModalOpen(true);
              }}
              className="px-4 py-2 bg-[#ec5b13] text-white rounded-xl text-sm font-semibold hover:bg-[#ec5b13]/90 transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {t.addNewBookmark}
            </button>
          </div>

          {/* 书签拖拽排序列表 */}
          {currentCategory.bookmarks.length > 0 ? (
            <div className="p-2 sm:p-3">
              <BookmarksReorderList
                categoryId={currentCategory.id}
                bookmarks={currentCategory.bookmarks}
                onSaveOrder={setBookmarksOrder}
                renderIcon={renderItemIcon}
                onEdit={handleEditBookmark}
                onDelete={(b) => {
                  setConfirmModal({
                    isOpen: true,
                    title: t.deleteConfirmBookmark.split('?')[0],
                    message: t.deleteConfirmBookmark,
                    type: 'danger',
                    onConfirm: () => deleteBookmark(currentCategory.id, b.id)
                  });
                }}
              />
            </div>
          ) : (
            <div className="px-6 py-16 text-center text-slate-400">
              <div className="flex flex-col items-center gap-2">
                <FolderOpen className="w-10 h-10 text-slate-300" />
                <p>{t.emptyBookmarks}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 没有分类时的空状态 */}
      {state.categories.length === 0 && (
        <div className="text-center py-20">
          <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-500 mb-2">{t.emptyCategories}</h3>
          <p className="text-slate-400 mb-6">{t.emptyCategoriesDesc}</p>
        </div>
      )}

      {/* 分类编辑模态框 */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsCategoryModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold">{editingCategory ? t.editCategory : t.addCategory}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">{t.categoryName}</label>
                <input
                  type="text"
                  id="category-name-input"
                  className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors"
                  placeholder="..."
                  value={categoryForm.title}
                  onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">{t.categoryIconLabel}</label>
                <input
                  type="text"
                  className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors"
                  placeholder={t.categoryIconDesc}
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                />
                <p className="text-xs text-slate-400 mt-1">
                  {t.categoryIconDesc.includes('支持') ? '支持 ' : 'Supports '}
                  <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="text-[#ec5b13] hover:underline">{t.iconsLibrary}</a> 
                  {t.categoryIconDesc.includes('支持') ? ' 或图片 URL' : ' or Image URL'}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">{t.categoryLayoutLabel}</label>
                <div className="flex gap-3 mt-1.5">
                  <button
                    onClick={() => setCategoryForm({ ...categoryForm, layout: 'card' })}
                    className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${categoryForm.layout === 'card'
                      ? 'border-[#ec5b13] bg-[#ec5b13]/5 text-[#ec5b13]'
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                  >
                    <LayoutList className="w-5 h-5" />
                    <span className="text-xs font-bold">{t.layoutCard.split(' ')[0]}</span>
                  </button>
                  <button
                    onClick={() => setCategoryForm({ ...categoryForm, layout: 'grid' })}
                    className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${categoryForm.layout === 'grid'
                      ? 'border-[#ec5b13] bg-[#ec5b13]/5 text-[#ec5b13]'
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                  >
                    <LayoutGrid className="w-5 h-5" />
                    <span className="text-xs font-bold">{t.layoutGrid.split(' ')[0]}</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">{t.categoryVisibility}</label>
                <div className="flex gap-3 mt-1.5">
                  <button
                    onClick={() => setCategoryForm({ ...categoryForm, isHidden: false })}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${!categoryForm.isHidden
                      ? 'border-[#ec5b13] bg-[#ec5b13]/5 text-[#ec5b13]'
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-bold">{t.visibilityPublic.split(' ')[0]}</span>
                  </button>
                  <button
                    onClick={() => setCategoryForm({ ...categoryForm, isHidden: true })}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${categoryForm.isHidden
                      ? 'border-[#ec5b13] bg-[#ec5b13]/5 text-[#ec5b13]'
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                  >
                    <EyeOff className="w-4 h-4" />
                    <span className="text-xs font-bold">{t.visibilityHidden.match(/^([^\(]+)/)?.[1].trim() || 'Hidden'}</span>
                  </button>
                </div>
                {categoryForm.isHidden && (
                  <p className="text-[10px] text-slate-400 mt-2 ml-1">
                    {t.visibilityHiddenDesc}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 font-medium hover:bg-slate-50 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveCategory}
                className="px-5 py-2.5 rounded-xl bg-[#ec5b13] text-white font-semibold hover:bg-[#ec5b13]/90 transition-colors shadow-lg shadow-[#ec5b13]/20"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 书签编辑模态框 */}
      {isBookmarkModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsBookmarkModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold">{editingBookmark ? t.editBookmark : t.addBookmark}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">{t.bookmarkTitle}</label>
                <input type="text" className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors" placeholder="..." value={bookmarkForm.title} onChange={(e) => setBookmarkForm({ ...bookmarkForm, title: e.target.value })} autoFocus />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">{t.bookmarkUrl}</label>
                <input type="text" className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors" placeholder="https://example.com" value={bookmarkForm.url} onChange={(e) => setBookmarkForm({ ...bookmarkForm, url: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">{t.bookmarkLanUrl}</label>
                <input type="text" className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors" placeholder="http://192.168.1.10" value={bookmarkForm.lanUrl} onChange={(e) => setBookmarkForm({ ...bookmarkForm, lanUrl: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">{t.bookmarkDesc}</label>
                <input type="text" className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors" placeholder="..." value={bookmarkForm.description} onChange={(e) => setBookmarkForm({ ...bookmarkForm, description: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">{t.bookmarkIcon}</label>
                <input type="text" className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors" placeholder="URL / Lucide" value={bookmarkForm.icon} onChange={(e) => setBookmarkForm({ ...bookmarkForm, icon: e.target.value })} />
                <div className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  <p>{t.autoFaviconTip}</p>
                  <p>{state.settings.language === 'zh-CN' ? '点击 ' : 'Click '} <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="text-[#ec5b13] hover:underline font-medium">{t.iconsLibrary}</a>，{state.settings.language === 'zh-CN' ? '跳转到图标库' : 'jump to icons library'}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsBookmarkModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 font-medium hover:bg-slate-50 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveBookmark}
                className="px-5 py-2.5 rounded-xl bg-[#ec5b13] text-white font-semibold hover:bg-[#ec5b13]/90 transition-colors shadow-lg shadow-[#ec5b13]/20"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={t.confirm}
        cancelText={t.cancel}
        type={confirmModal.type}
      />
    </div>
  );
}
