/**
 * 书签目录管理页面
 * NOTE: 支持分组的 CRUD 和站点的 CRUD，包含分类和书签的模态框编辑
 */

import React, { useState } from 'react';
import { useData, type Category, type Bookmark } from '../../context/DataContext.tsx';
import { Plus, Edit2, Trash2, FolderOpen, Link as LinkIcon, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

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
  const [activeCategory, setActiveCategory] = useState<string>(state.categories[0]?.id || '');

  // 分类模态框状态
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ title: '', icon: 'Folder' });

  // 书签模态框状态
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [bookmarkForm, setBookmarkForm] = useState({ title: '', url: '', icon: 'Globe', description: '' });

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
    setCategoryForm({ title: '', icon: 'Folder' });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({ title: category.title, icon: category.icon });
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = (id: string) => {
    if (!window.confirm('确定要删除该分类及其下所有书签吗？')) return;
    deleteCategory(id);
    // NOTE: 删除后自动切换到第一个分类
    const remaining = state.categories.filter((c) => c.id !== id);
    setActiveCategory(remaining[0]?.id || '');
  };

  // 书签处理器
  const handleSaveBookmark = () => {
    if (!bookmarkForm.title || !bookmarkForm.url || !activeCategory) return;
    if (editingBookmark) {
      updateBookmark(activeCategory, editingBookmark.id, bookmarkForm);
    } else {
      addBookmark(activeCategory, bookmarkForm);
    }
    setIsBookmarkModalOpen(false);
    setEditingBookmark(null);
    setBookmarkForm({ title: '', url: '', icon: 'Globe', description: '' });
  };

  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setBookmarkForm({
      title: bookmark.title,
      url: bookmark.url,
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

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight">书签目录管理</h2>
          <p className="text-slate-500">管理您的书签分类及站点信息</p>
        </div>
        <button
          id="add-category-btn"
          onClick={() => {
            setEditingCategory(null);
            setCategoryForm({ title: '', icon: 'Folder' });
            setIsCategoryModalOpen(true);
          }}
          className="px-4 py-2.5 bg-[#ec5b13] text-white rounded-xl text-sm font-semibold hover:bg-[#ec5b13]/90 transition-all flex items-center gap-2 shadow-lg shadow-[#ec5b13]/20 self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          添加分类
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
                className={`py-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                  activeCategory === category.id
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
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => handleEditCategory(currentCategory)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-[#ec5b13] hover:bg-[#ec5b13]/5 transition-all"
                  title="编辑分类"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(currentCategory.id)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="删除分类"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {/* 分类排序按钮 */}
                {currentCategoryIndex > 0 && (
                  <button
                    onClick={() => reorderCategories(currentCategoryIndex, currentCategoryIndex - 1)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                    title="上移分类"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                )}
                {currentCategoryIndex < state.categories.length - 1 && (
                  <button
                    onClick={() => reorderCategories(currentCategoryIndex, currentCategoryIndex + 1)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                    title="下移分类"
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
                setBookmarkForm({ title: '', url: '', icon: 'Globe', description: '' });
                setIsBookmarkModalOpen(true);
              }}
              className="text-[#ec5b13] text-sm font-semibold flex items-center gap-1 hover:underline"
            >
              <Plus className="w-4 h-4" />
              添加新站点
            </button>
          </div>

          {/* 书签表格 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold w-8"></th>
                  <th className="px-4 py-3 font-semibold w-14">图标</th>
                  <th className="px-4 py-3 font-semibold">名称</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">URL 地址</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">描述</th>
                  <th className="px-4 py-3 font-semibold text-right">操作</th>
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
                        {bookmark.icon.startsWith('http') ? (
                          <img src={bookmark.icon} alt={bookmark.title} className="w-6 h-6 object-contain" />
                        ) : (
                          <LinkIcon className="w-5 h-5" />
                        )}
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
                            if (window.confirm(`确定删除「${bookmark.title}」？`)) {
                              deleteBookmark(currentCategory.id, bookmark.id);
                            }
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
                        <p>暂无站点，点击上方「添加新站点」开始</p>
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
          <h3 className="text-lg font-semibold text-slate-500 mb-2">还没有任何分类</h3>
          <p className="text-slate-400 mb-6">点击上方「添加分类」按钮创建第一个分组</p>
        </div>
      )}

      {/* 分类编辑模态框 */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsCategoryModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold">{editingCategory ? '编辑分类' : '添加分类'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">分类名称</label>
                <input
                  type="text"
                  id="category-name-input"
                  className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors"
                  placeholder="例如：开发工具"
                  value={categoryForm.title}
                  onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">图标</label>
                <input
                  type="text"
                  className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors"
                  placeholder="Lucide 图标名或图片 URL"
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                />
                <p className="text-xs text-slate-400 mt-1">
                  支持 <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="text-[#ec5b13] hover:underline">Lucide 图标名</a> 或图片 URL
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 font-medium hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveCategory}
                className="px-5 py-2.5 rounded-xl bg-[#ec5b13] text-white font-semibold hover:bg-[#ec5b13]/90 transition-colors shadow-lg shadow-[#ec5b13]/20"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 书签编辑模态框 */}
      {isBookmarkModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsBookmarkModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold">{editingBookmark ? '编辑站点' : '添加站点'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">站点名称</label>
                <input
                  type="text"
                  id="bookmark-name-input"
                  className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors"
                  placeholder="例如：GitHub"
                  value={bookmarkForm.title}
                  onChange={(e) => setBookmarkForm({ ...bookmarkForm, title: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">URL 地址</label>
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
                <label className="text-sm font-semibold text-slate-700">描述（可选）</label>
                <input
                  type="text"
                  className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors"
                  placeholder="简短描述该站点"
                  value={bookmarkForm.description}
                  onChange={(e) => setBookmarkForm({ ...bookmarkForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">图标</label>
                <input
                  type="text"
                  className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors"
                  placeholder="Globe"
                  value={bookmarkForm.icon}
                  onChange={(e) => setBookmarkForm({ ...bookmarkForm, icon: e.target.value })}
                />
                <div className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  <p>留空或填写 Globe 使用默认图标，也可填写网站 favicon URL</p>
                  <p>点击 <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="text-[#ec5b13] hover:underline font-medium">图标库</a>，跳转到图标库</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsBookmarkModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 font-medium hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveBookmark}
                className="px-5 py-2.5 rounded-xl bg-[#ec5b13] text-white font-semibold hover:bg-[#ec5b13]/90 transition-colors shadow-lg shadow-[#ec5b13]/20"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
