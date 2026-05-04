/**
 * 书签目录管理页面
 * NOTE: 支持分组的 CRUD 和站点的 CRUD，包含分类和书签的模态框编辑
 */

import React, { useState } from 'react';
import { useData, type Category, type Bookmark } from '../../context/DataContext.tsx';
import * as Icons from 'lucide-react';
import { Plus, Edit2, Trash2, FolderOpen, ChevronUp, ChevronDown, LayoutGrid, LayoutList, Eye, EyeOff, Lock, Globe } from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations.ts';
import ConfirmModal from '../../components/ConfirmModal.tsx';

export default function Bookmarks() {
  const {
    state,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
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
  const [bookmarkForm, setBookmarkForm] = useState({ title: '', url: '', lanUrl: '', icon: '', description: '' });

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
  const currentCategoryIndex = state.categories.findIndex((c) => c.id === activeCategory);

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
    if (!bookmarkForm.title || !bookmarkForm.url || !activeCategory) return;
    
    const finalForm = { ...bookmarkForm };
    // 如果没有填写图标，尝试自动补全为解析出的 favicon URL，实现数据固化，提升加载速度
    if (!finalForm.icon) {
      finalForm.icon = getFaviconUrl(finalForm.url);
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
      url: bookmark.url,
      lanUrl: bookmark.lanUrl || '',
      icon: bookmark.icon,
      description: bookmark.description || '',
    });
    setIsBookmarkModalOpen(true);
  };

  /** 移动书签位置 */
  const handleMoveBookmark = (index: number, direction: 'up' | 'down') => {
    if (!activeCategory) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    reorderBookmarks(activeCategory, index, targetIndex);
  };

  /** 获取 Favicon 链接 */
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return '';
    }
  };

  /** 渲染预览图标 */
  const renderItemIcon = (iconName: string, siteUrl?: string, size: string = 'w-5 h-5') => {
    // 1. URL 图片
    if (iconName && (iconName.startsWith('http://') || iconName.startsWith('https://'))) {
      return (
        <img
          src={iconName}
          className={`${size} object-contain`}
          alt="icon"
          onError={(e) => {
            if (siteUrl) (e.target as HTMLImageElement).src = getFaviconUrl(siteUrl);
          }}
        />
      );
    }

    // 2. Lucide 图标
    const IconComponent = (Icons as any)[iconName];
    if (IconComponent) return <IconComponent className={size} />;

    // 3. 自动 Favicon
    if (siteUrl) {
      return <img src={getFaviconUrl(siteUrl)} className={`${size} object-contain`} alt="favicon" />;
    }

    // 4. 默认图标
    return <Globe className={size} />;
  };

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight">{t.bookmarksTitle}</h2>
          <p className="text-slate-500">{t.bookmarksDesc}</p>
        </div>
        <button
          id="add-category-btn"
          onClick={() => {
            setEditingCategory(null);
            setCategoryForm({ title: '', icon: 'Folder', layout: 'card', isHidden: false });
            setIsCategoryModalOpen(true);
          }}
          className="px-4 py-2.5 bg-[#ec5b13] text-white rounded-xl text-sm font-semibold hover:bg-[#ec5b13]/90 transition-all flex items-center gap-2 shadow-lg shadow-[#ec5b13]/20 self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          {t.addCategory}
        </button>
      </div>

      {/* 分类标签页 */}
      {state.categories.length > 0 && (
        <div className="border-b border-slate-200 overflow-x-auto">
          <div className="flex gap-1">
            {state.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`py-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeCategory === category.id
                  ? 'border-[#ec5b13] text-[#ec5b13]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
              >
                {category.title}
                <span className="text-xs ml-1 text-slate-400">({category.bookmarks.length})</span>
              </button>
            ))}
          </div>
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
              <div className="flex items-center gap-1 ml-2">
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
                {/* 分类排序按钮 */}
                {currentCategoryIndex > 0 && (
                  <button
                    onClick={() => reorderCategories(currentCategoryIndex, currentCategoryIndex - 1)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                    title="Up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                )}
                {currentCategoryIndex < state.categories.length - 1 && (
                  <button
                    onClick={() => reorderCategories(currentCategoryIndex, currentCategoryIndex + 1)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                    title="Down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </h3>
            <button
              id="add-bookmark-btn"
              onClick={() => {
                setEditingBookmark(null);
                setBookmarkForm({ title: '', url: '', lanUrl: '', icon: '', description: '' });
                setIsBookmarkModalOpen(true);
              }}
              className="text-[#ec5b13] text-sm font-semibold flex items-center gap-1 hover:underline"
            >
              <Plus className="w-4 h-4" />
              {t.addNewBookmark}
            </button>
          </div>

          {/* 书签表格 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold w-8"></th>
                  <th className="px-4 py-3 font-semibold w-14">{t.tableIcon}</th>
                  <th className="px-4 py-3 font-semibold">{t.tableName}</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">{t.tableUrl}</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">{t.tableDesc}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t.tableActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentCategory.bookmarks.map((bookmark, index) => (
                  <tr key={bookmark.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {index > 0 && (
                          <button
                            onClick={() => handleMoveBookmark(index, 'up')}
                            className="p-0.5 text-slate-400 hover:text-slate-600"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                        )}
                        {index < currentCategory.bookmarks.length - 1 && (
                          <button
                            onClick={() => handleMoveBookmark(index, 'down')}
                            className="p-0.5 text-slate-400 hover:text-slate-600"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden text-slate-500">
                        {renderItemIcon(bookmark.icon, bookmark.url, 'w-6 h-6')}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{bookmark.title}</td>
                    <td className="px-4 py-3 text-slate-500 text-sm hidden sm:table-cell max-w-48 truncate">
                      {bookmark.url}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-sm hidden md:table-cell">
                      {bookmark.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEditBookmark(bookmark)}
                          className="p-2 rounded-md text-slate-400 hover:text-[#ec5b13] hover:bg-[#ec5b13]/5 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: t.deleteConfirmBookmark.split('?')[0],
                              message: t.deleteConfirmBookmark,
                              type: 'danger',
                              onConfirm: () => deleteBookmark(currentCategory.id, bookmark.id)
                            });
                          }}
                          className="p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {currentCategory.bookmarks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <FolderOpen className="w-10 h-10 text-slate-300" />
                        <p>{t.emptyBookmarks}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                <input
                  type="text"
                  id="bookmark-name-input"
                  className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors"
                  placeholder="..."
                  value={bookmarkForm.title}
                  onChange={(e) => setBookmarkForm({ ...bookmarkForm, title: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">{t.bookmarkUrl}</label>
                <input
                  type="text"
                  id="bookmark-url-input"
                  className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors"
                  placeholder="https://example.com"
                  value={bookmarkForm.url}
                  onChange={(e) => setBookmarkForm({ ...bookmarkForm, url: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">{t.bookmarkLanUrl}</label>
                <input
                  type="text"
                  className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors"
                  placeholder="http://192.168.1.10"
                  value={bookmarkForm.lanUrl}
                  onChange={(e) => setBookmarkForm({ ...bookmarkForm, lanUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">{t.bookmarkDesc}</label>
                <input
                  type="text"
                  className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors"
                  placeholder="..."
                  value={bookmarkForm.description}
                  onChange={(e) => setBookmarkForm({ ...bookmarkForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">{t.bookmarkIcon}</label>
                <input
                  type="text"
                  className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors"
                  placeholder="URL / Lucide"
                  value={bookmarkForm.icon}
                  onChange={(e) => setBookmarkForm({ ...bookmarkForm, icon: e.target.value })}
                />
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
