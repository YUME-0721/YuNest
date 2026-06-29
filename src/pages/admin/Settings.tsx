/**
 * 个性化设置页面
 * NOTE: 管理网站名称、搜索引擎、壁纸配置（固定/API/本地上传）、视觉效果
 */

import React, { useState, useRef } from 'react';
import { useData, PRESET_SEARCH_ENGINES, DEFAULT_SETTINGS, type Bookmark } from '../../context/DataContext.tsx';
import { Settings as SettingsIcon, Image as ImageIcon, Search, CheckCircle, Upload, RefreshCw, Clock, Globe, LayoutGrid, AlarmClock, CloudSun, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations.ts';
import ConfirmModal from '../../components/ConfirmModal.tsx';

export default function Settings() {
  const { state, updateSettings, addWidget, updateWidget, deleteWidget, reorderWidgets } = useData();
  const [localSettings, setLocalSettings] = useState(state.settings);
  const t = TRANSLATIONS[state.settings.language || 'zh-CN'];
  const [saved, setSaved] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(state.settings.wallpaperUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // 小组件模态框状态
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Bookmark | null>(null);
  const [widgetForm, setWidgetForm] = useState<{ title: string; size: string; widgetType: string; }>({
    title: 'Clock', size: '2x1', widgetType: 'clock'
  });

  const handleSaveWidget = () => {
    const title = widgetForm.widgetType === 'clock' ? 'Clock' :
                  widgetForm.widgetType === 'search' ? 'Search' :
                  widgetForm.widgetType === 'weather' ? 'Weather' : 'Widget';
    const finalForm = { ...widgetForm, title, itemType: 'widget', url: '', icon: '' } as any;
    if (editingWidget) {
      updateWidget(editingWidget.id, finalForm);
    } else {
      addWidget(finalForm);
    }
    setIsWidgetModalOpen(false);
    setEditingWidget(null);
    setWidgetForm({ title: 'Clock', size: '2x1', widgetType: 'clock' });
  };

  const handleEditWidget = (widget: Bookmark) => {
    setEditingWidget(widget);
    setWidgetForm({ title: widget.title || 'Widget', size: widget.size || '1x1', widgetType: widget.widgetType || 'clock' });
    setIsWidgetModalOpen(true);
  };

  const handleMoveWidget = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    reorderWidgets(index, targetIndex);
  };

  const handleSave = () => {
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setIsResetModalOpen(true);
  };

  const confirmReset = () => {
    setLocalSettings(DEFAULT_SETTINGS);
    setPreviewUrl(DEFAULT_SETTINGS.wallpaperUrl);
  };

  /** 处理本地壁纸上传——转为 base64 存入 localStorage */
  const handleLocalWallpaper = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // NOTE: 限制文件大小，localStorage 空间有限
    if (file.size > 5 * 1024 * 1024) {
      alert(t.uploadLimit);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLocalSettings({ ...localSettings, wallpaperType: 'local', localWallpaper: base64 });
      setPreviewUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  /** 刷新壁纸预览（对 API 类型附加时间戳） */
  const refreshPreview = () => {
    if (localSettings.wallpaperType === 'api') {
      const url = localSettings.wallpaperUrl || 'https://pic.yumekai.top/pic?img=ua';
      const separator = url.includes('?') ? '&' : '?';
      setPreviewUrl(`${url}${separator}t=${Date.now()}`);
    } else if (localSettings.wallpaperType === 'local') {
      setPreviewUrl(localSettings.localWallpaper);
    } else {
      setPreviewUrl(localSettings.wallpaperUrl || 'https://pic.yumekai.top/pic?img=ua');
    }
  };

  const getEffectivePreviewUrl = () => {
    if (localSettings.wallpaperType === 'local') {
      return localSettings.localWallpaper || previewUrl;
    }
    return previewUrl || localSettings.wallpaperUrl || 'https://pic.yumekai.top/pic?img=ua';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8 min-w-0">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">{t.navPersonalization}</h2>
          <p className="text-slate-500 mt-2">{t.siteDescription}</p>
        </div>
      </header>

      <div className="space-y-12">
        {/* 基本设置 */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <SettingsIcon className="w-5 h-5 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">{t.basicSettings}</h3>
          </div>
          <div className="grid gap-6 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm min-w-0 overflow-hidden">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">{t.siteNameLabel}</label>
              <input
                type="text"
                id="setting-site-name"
                className="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none border transition-colors"
                placeholder={t.siteNamePlaceholder}
                value={localSettings.siteName}
                onChange={(e) => setLocalSettings({ ...localSettings, siteName: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-4">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                {t.searchEngineLabel}
              </label>
              
              <div className="flex overflow-x-auto pb-4 gap-4 px-1 -mx-1 scrollbar-hide">
                {PRESET_SEARCH_ENGINES.map((engine) => (
                  <button
                    key={engine.id}
                    type="button"
                    onClick={() => {
                      setLocalSettings({ ...localSettings, searchEngine: engine.url });
                    }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all shrink-0 min-w-[72px] ${
                      localSettings.searchEngine === engine.url
                        ? 'bg-[#ec5b13]/10 border-[#ec5b13] ring-1 ring-[#ec5b13]'
                        : 'bg-white border-slate-200 hover:border-[#ec5b13]/50'
                    }`}
                  >
                    <img src={engine.icon} alt={engine.name} className="w-8 h-8 rounded-md" />
                    <span className={`text-xs font-medium ${
                      localSettings.searchEngine === engine.url ? 'text-[#ec5b13]' : 'text-slate-500'
                    }`}>
                      {engine.name}
                    </span>
                  </button>
                ))}

                {/* 其他搜索引擎 */}
                <button
                  type="button"
                  onClick={() => {
                    // 如果当前选中的是预设，点击“其他”时清空输入，强制显示自定义框
                    if (PRESET_SEARCH_ENGINES.some(e => e.url === localSettings.searchEngine)) {
                      setLocalSettings({ ...localSettings, searchEngine: '' });
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all shrink-0 min-w-[72px] ${
                    !PRESET_SEARCH_ENGINES.some(e => e.url === localSettings.searchEngine)
                      ? 'bg-[#ec5b13]/10 border-[#ec5b13] ring-1 ring-[#ec5b13]'
                      : 'bg-white border-slate-200 hover:border-[#ec5b13]/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center bg-slate-50 border border-slate-100 ${
                    !PRESET_SEARCH_ENGINES.some(e => e.url === localSettings.searchEngine) ? 'text-[#ec5b13]' : 'text-slate-400'
                  }`}>
                    <Search className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-medium ${
                    !PRESET_SEARCH_ENGINES.some(e => e.url === localSettings.searchEngine) ? 'text-[#ec5b13]' : 'text-slate-500'
                  }`}>
                    {t.searchEngineOther || '其他'}
                  </span>
                </button>
              </div>

              {!PRESET_SEARCH_ENGINES.some(e => e.url === localSettings.searchEngine) && (
                <div className="space-y-2 animate-fade-in">
                  <p className="text-xs font-medium text-slate-400">{t.searchEngineManual}</p>
                  <input
                    type="text"
                    id="setting-search-engine"
                    className="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none border transition-colors text-sm"
                    placeholder="例如: https://www.google.com/search?q="
                    value={localSettings.searchEngine}
                    onChange={(e) => setLocalSettings({ ...localSettings, searchEngine: e.target.value })}
                  />
                  <p className="text-xs text-slate-400">{t.searchEngineDesc}</p>
                </div>
              )}
            </div>

            {/* 认证跳转开关 */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-800">{t.authRedirectLabel}</label>
                <p className="text-xs text-slate-500">{t.authRedirectDesc}</p>
              </div>
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, authRedirect: !localSettings.authRedirect })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                  localSettings.authRedirect ? 'bg-[#ec5b13]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    localSettings.authRedirect ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* 外观设置 */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <ImageIcon className="w-5 h-5 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">{t.appearanceSettings}</h3>
          </div>
          <div className="grid gap-6 bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm min-w-0 overflow-hidden">
            {/* 语言选择 */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-slate-400" />
                {t.languageLabel}
              </label>
              <select
                value={localSettings.language}
                onChange={(e) => setLocalSettings({ ...localSettings, language: e.target.value as any })}
                className="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none border transition-colors text-sm font-medium"
              >
                <option value="zh-CN">简体中文 (Chinese Simplified)</option>
                <option value="en-US">English (United States)</option>
              </select>
            </div>
          </div>
        </section>

        {/* 小组件 */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <LayoutGrid className="w-5 h-5 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">{t.widgetSettings || '小组件'}</h3>
          </div>
          <div className="grid gap-6 bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm min-w-0 overflow-hidden">

            {/* 对齐方式 */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-slate-400" />
                {t.widgetAlignmentLabel || '对齐方式'}
              </label>
              <select
                value={localSettings.widgetAlignment || 'center'}
                onChange={(e) => setLocalSettings({ ...localSettings, widgetAlignment: e.target.value as any })}
                className="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none border transition-colors text-sm font-medium"
              >
                <option value="left">{t.alignLeft || '左对齐'}</option>
                <option value="center">{t.alignCenter || '居中'}</option>
                <option value="right">{t.alignRight || '右对齐'}</option>
              </select>
            </div>

            {/* 时区 */}
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400" />
                {t.timezoneLabel}
              </label>
              <select
                className="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none border transition-colors text-sm font-medium cursor-pointer"
                value={localSettings.timezone}
                onChange={(e) => setLocalSettings({ ...localSettings, timezone: e.target.value })}
              >
                <option value="">{t.timezoneSystem}</option>
                <option value="Asia/Shanghai">中国/北京 (Asia/Shanghai)</option>
                <option value="Asia/Hong_Kong">中国/香港 (Asia/Hong_Kong)</option>
                <option value="Asia/Taipei">中国/台北 (Asia/Taipei)</option>
                <option value="Asia/Tokyo">日本/东京 (Asia/Tokyo)</option>
                <option value="Asia/Singapore">新加坡 (Asia/Singapore)</option>
                <option value="America/New_York">美国/纽约 (America/New_York)</option>
                <option value="America/Los_Angeles">美国/洛杉矶 (America/Los_Angeles)</option>
                <option value="Europe/London">英国/伦敦 (Europe/London)</option>
                <option value="Europe/Paris">法国/巴黎 (Europe/Paris)</option>
                <option value="Europe/Berlin">德国/柏林 (Europe/Berlin)</option>
                <option value="Australia/Sydney">澳大利亚/悉尼 (Australia/Sydney)</option>
              </select>
              <p className="text-xs text-slate-400">{t.timezoneDesc}</p>
            </div>

            {/* 小组件管理 */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-slate-400" />
                  {t.manageWidgets || '小组件列表'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setEditingWidget(null);
                    setWidgetForm({ title: 'Clock', size: '2x1', widgetType: 'clock' });
                    setIsWidgetModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-[#ec5b13] text-white rounded-lg text-xs font-semibold hover:bg-[#d4520f] transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t.addWidget || '添加小组件'}
                </button>
              </div>

              {state.widgets.length === 0 ? (
                <div className="text-center py-8 text-slate-400 flex flex-col items-center gap-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <LayoutGrid className="w-8 h-8 opacity-20" />
                  <p className="text-sm">{t.noWidgets || '暂无小组件，点击右上角添加'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {state.widgets.map((widget, index) => (
                    <div key={widget.id} className="relative group border border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center gap-2">
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditWidget(widget)} className="p-1 text-slate-400 hover:text-[#ec5b13] bg-white rounded shadow-sm"><Edit2 className="w-3 h-3" /></button>
                        <button onClick={() => deleteWidget(widget.id)} className="p-1 text-slate-400 hover:text-red-500 bg-white rounded shadow-sm"><Trash2 className="w-3 h-3" /></button>
                      </div>
                      <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-col">
                        {index > 0 && <button onClick={() => handleMoveWidget(index, 'up')} className="p-0.5 text-slate-400 hover:text-slate-600 bg-white rounded shadow-sm"><ChevronLeft className="w-3 h-3" /></button>}
                        {index < state.widgets.length - 1 && <button onClick={() => handleMoveWidget(index, 'down')} className="p-0.5 text-slate-400 hover:text-slate-600 bg-white rounded shadow-sm"><ChevronRight className="w-3 h-3" /></button>}
                      </div>
                      <div className="w-12 h-12 bg-[#ec5b13]/10 text-[#ec5b13] rounded-lg flex items-center justify-center mb-1">
                        {widget.widgetType === 'clock' ? <AlarmClock className="w-6 h-6" /> :
                         widget.widgetType === 'search' ? <Search className="w-6 h-6" /> :
                         widget.widgetType === 'weather' ? <CloudSun className="w-6 h-6" /> :
                         <LayoutGrid className="w-6 h-6" />}
                      </div>
                      <div className="font-semibold text-slate-700 text-xs truncate w-full text-center">
                        {widget.widgetType === 'clock' ? (t.widgetClock || '时钟与日期') :
                         widget.widgetType === 'search' ? (t.widgetSearch || '快速搜索') :
                         widget.widgetType === 'weather' ? (t.widgetWeather || '天气预报') : widget.title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono bg-slate-200 px-2 py-0.5 rounded">{widget.size}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className="sticky bottom-0 left-0 right-0 z-40 -mx-4 sm:-mx-8 px-4 sm:px-8 py-4 sm:py-6 flex justify-end gap-3 sm:gap-4 mt-8 bg-white/80 backdrop-blur-md border-t border-slate-100 sm:bg-transparent sm:backdrop-blur-none sm:border-0 pointer-events-none">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all shadow-sm pointer-events-auto text-sm sm:text-base"
          >
            {t.reset}
          </button>
          <button
            onClick={handleSave}
            className={`flex-[2] sm:flex-none px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold shadow-2xl transition-all flex items-center justify-center gap-2 pointer-events-auto text-sm sm:text-base ${
              saved
                ? 'bg-green-500 text-white shadow-green-500/30'
                : 'bg-[#ec5b13] text-white shadow-[#ec5b13]/30 hover:scale-[1.05] active:scale-[0.95]'
            }`}
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                {t.saved}
              </>
            ) : (
              t.saveSettings
            )}
          </button>
        </footer>
      </div>

      {/* 小组件编辑模态框 */}
      {isWidgetModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsWidgetModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-800">{editingWidget ? (t.editWidget || '编辑小组件') : (t.addWidget || '添加小组件')}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">{t.widgetTypeLabel || '组件类型'}</label>
                <select
                  className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors appearance-none"
                  value={widgetForm.widgetType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    let newSize = widgetForm.size;
                    if (newType !== 'search' && (newSize === '3x1' || newSize === '4x1')) newSize = '2x1';
                    setWidgetForm({ ...widgetForm, widgetType: newType, size: newSize });
                  }}
                >
                  <option value="clock">{t.widgetClock || '时钟与日期'}</option>
                  <option value="search">{t.widgetSearch || '快速搜索'}</option>
                  <option value="weather">{t.widgetWeather || '天气预报'}</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">{t.itemSizeLabel || '显示尺寸'}</label>
                <div
                  className="grid gap-2 mt-1.5"
                  style={{ gridTemplateColumns: `repeat(${widgetForm.widgetType === 'search' ? 6 : 4}, minmax(0, 1fr))` }}
                >
                  {(widgetForm.widgetType === 'search'
                    ? ['1x1', '2x1', '3x1', '4x1', '1x2', '2x2']
                    : ['1x1', '2x1', '1x2', '2x2']
                  ).map(s => (
                    <button
                      key={s}
                      onClick={() => setWidgetForm({ ...widgetForm, size: s })}
                      className={`p-2 rounded-lg border-2 transition-all text-xs font-bold font-mono tracking-wider ${
                        (widgetForm.size || '1x1') === s
                          ? 'border-[#ec5b13] bg-[#ec5b13]/5 text-[#ec5b13]'
                          : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setIsWidgetModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 font-medium hover:bg-slate-50 transition-colors">{t.cancel}</button>
              <button onClick={handleSaveWidget} className="px-5 py-2.5 rounded-xl bg-[#ec5b13] text-white font-semibold hover:bg-[#d4520f] transition-colors shadow-lg shadow-[#ec5b13]/20">{t.save}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={confirmReset}
        title={t.reset}
        message={t.resetSettingsConfirm}
        confirmText={t.reset}
        cancelText={t.cancel || '取消'}
        type="warning"
      />
    </div>
  );
}
