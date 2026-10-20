/**
 * 个性化设置页面
 */

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { useData, PRESET_SEARCH_ENGINES, DEFAULT_SETTINGS, type Settings as SettingsType } from '../../context/DataContext.tsx';
import { Settings as SettingsIcon, Image as ImageIcon, Search, CheckCircle, LayoutGrid, LayoutList, HelpCircle, PanelLeft, PanelRight } from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations.ts';
import ConfirmModal from '../../components/ConfirmModal.tsx';

export default function Settings() {
  const { state, updateSettings } = useData();
  const [localSettings, setLocalSettings] = useState(state.settings);
  const t = TRANSLATIONS[state.settings.language || 'zh-CN'];
  const [saved, setSaved] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(state.settings.wallpaperUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // 外部状态发生变化时（如重置或云同步）同步至本组件
  useEffect(() => {
    setLocalSettings(state.settings);
  }, [state.settings]);

  // 实时更新并持久化设置
  const handleUpdate = (patch: Partial<SettingsType>) => {
    setLocalSettings((prev) => {
      const next = { ...prev, ...patch };
      updateSettings(next);
      return next;
    });
    setSaved(true);
  };

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [saved]);

  const handleReset = () => {
    setIsResetModalOpen(true);
  };

  const confirmReset = () => {
    updateSettings(DEFAULT_SETTINGS);
    setLocalSettings(DEFAULT_SETTINGS);
    setPreviewUrl(DEFAULT_SETTINGS.wallpaperUrl);
    setIsResetModalOpen(false);
    setSaved(true);
  };

  /** 处理本地壁纸上传——转为 base64 存入 localStorage */
  const handleLocalWallpaper = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
                onChange={(e) => handleUpdate({ siteName: e.target.value })}
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
                      handleUpdate({ searchEngine: engine.url });
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

                <button
                  type="button"
                  onClick={() => {
                    if (PRESET_SEARCH_ENGINES.some(e => e.url === localSettings.searchEngine)) {
                      handleUpdate({ searchEngine: '' });
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
                    onChange={(e) => handleUpdate({ searchEngine: e.target.value })}
                  />
                  <p className="text-xs text-slate-400">{t.searchEngineDesc}</p>
                </div>
              )}
            </div>

            {/* 认证跳转开关 */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-800">{t.authRedirectLabel}</label>
                <div className="relative group flex items-center">
                  <div
                    className="p-1 rounded-full text-slate-400 hover:text-[#ec5b13] hover:bg-[#ec5b13]/10 transition-colors cursor-help"
                    title={t.authRedirectDesc}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:flex items-center px-3 py-1.5 bg-slate-900/95 text-white text-xs font-medium rounded-xl w-64 sm:w-72 shadow-2xl backdrop-blur-md z-50 pointer-events-none transition-all leading-relaxed border border-white/10">
                    {t.authRedirectDesc}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUpdate({ authRedirect: !localSettings.authRedirect })}
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
                onChange={(e) => handleUpdate({ language: e.target.value as any })}
                className="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none border transition-colors text-sm font-medium"
              >
                <option value="zh-CN">简体中文 (Chinese Simplified)</option>
                <option value="en-US">English (United States)</option>
              </select>
            </div>

            {/* 侧边栏位置调节 */}
            <div className="flex flex-col gap-3 pt-6 border-t border-slate-100">
              <div>
                <label className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                  <PanelLeft className="w-4 h-4 text-slate-400" />
                  {t.sidebarPositionLabel}
                </label>
                <p className="text-xs text-slate-400 mt-1">{t.sidebarPositionDesc}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => handleUpdate({ sidebarPosition: 'left' })}
                  className={`flex items-center justify-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                    (localSettings.sidebarPosition || 'left') === 'left'
                      ? 'bg-[#ec5b13]/10 border-[#ec5b13] text-[#ec5b13] ring-1 ring-[#ec5b13] font-semibold shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/60 font-medium'
                  }`}
                >
                  <PanelLeft className="w-5 h-5 shrink-0" />
                  <span className="text-sm">{t.sidebarLeft}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdate({ sidebarPosition: 'right' })}
                  className={`flex items-center justify-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                    localSettings.sidebarPosition === 'right'
                      ? 'bg-[#ec5b13]/10 border-[#ec5b13] text-[#ec5b13] ring-1 ring-[#ec5b13] font-semibold shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/60 font-medium'
                  }`}
                >
                  <PanelRight className="w-5 h-5 shrink-0" />
                  <span className="text-sm">{t.sidebarRight}</span>
                </button>
              </div>
            </div>

            {/* ===== 首页布局：分别设置展开卡片与紧凑宫格的尺寸 ===== */}
            <div className="pt-6 mt-2 border-t border-slate-100 space-y-5">
              {/* 展开卡片模式尺寸 (Card) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/60">
                  <div className="w-8 h-8 rounded-lg bg-[#ec5b13]/10 text-[#ec5b13] flex items-center justify-center shrink-0">
                    <LayoutList className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{t.layoutCardSizeTitle}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{t.layoutCardSizeDesc}</p>
                  </div>
                </div>

                {/* 展开卡片高度 */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">{t.cardHeightLabel}</label>
                    <span className="text-[11px] text-slate-400 font-mono">60 ~ 200 px</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={60}
                      max={200}
                      step={5}
                      value={localSettings.cardHeight || 80}
                      onChange={(e) => handleUpdate({ cardHeight: Number(e.target.value) })}
                      className="flex-1 accent-[#ec5b13] cursor-pointer"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={60}
                        max={200}
                        step={5}
                        value={localSettings.cardHeight || 80}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          handleUpdate({ cardHeight: isNaN(v) ? 80 : Math.min(200, Math.max(60, v)) });
                        }}
                        className="w-20 text-center text-sm font-mono font-bold text-[#ec5b13] bg-white rounded-lg py-1 outline-none border border-[#ec5b13]/25 focus:border-[#ec5b13] shadow-sm"
                      />
                      <span className="text-xs text-slate-400 font-medium">px</span>
                    </div>
                  </div>
                </div>

                {/* 展开卡片宽度 */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/50">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">{t.cardWidthLabel}</label>
                    <span className="text-[11px] text-slate-400 font-mono">120 ~ 400 px</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={120}
                      max={400}
                      step={10}
                      value={localSettings.cardWidth || 240}
                      onChange={(e) => handleUpdate({ cardWidth: Number(e.target.value) })}
                      className="flex-1 accent-[#ec5b13] cursor-pointer"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={120}
                        max={400}
                        step={10}
                        value={localSettings.cardWidth || 240}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          handleUpdate({ cardWidth: isNaN(v) ? 240 : Math.min(400, Math.max(120, v)) });
                        }}
                        className="w-20 text-center text-sm font-mono font-bold text-[#ec5b13] bg-white rounded-lg py-1 outline-none border border-[#ec5b13]/25 focus:border-[#ec5b13] shadow-sm"
                      />
                      <span className="text-xs text-slate-400 font-medium">px</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 紧凑宫格模式尺寸 (Grid) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/60">
                  <div className="w-8 h-8 rounded-lg bg-[#ec5b13]/10 text-[#ec5b13] flex items-center justify-center shrink-0">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{t.layoutGridSizeTitle}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{t.layoutGridSizeDesc}</p>
                  </div>
                </div>

                {/* 紧凑宫格高度 */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">{t.gridCardHeightLabel}</label>
                    <span className="text-[11px] text-slate-400 font-mono">50 ~ 200 px</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={50}
                      max={200}
                      step={5}
                      value={localSettings.gridCardHeight || 96}
                      onChange={(e) => handleUpdate({ gridCardHeight: Number(e.target.value) })}
                      className="flex-1 accent-[#ec5b13] cursor-pointer"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={50}
                        max={200}
                        step={5}
                        value={localSettings.gridCardHeight || 96}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          handleUpdate({ gridCardHeight: isNaN(v) ? 96 : Math.min(200, Math.max(50, v)) });
                        }}
                        className="w-20 text-center text-sm font-mono font-bold text-[#ec5b13] bg-white rounded-lg py-1 outline-none border border-[#ec5b13]/25 focus:border-[#ec5b13] shadow-sm"
                      />
                      <span className="text-xs text-slate-400 font-medium">px</span>
                    </div>
                  </div>
                </div>

                {/* 紧凑宫格宽度 */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/50">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">{t.gridCardWidthLabel}</label>
                    <span className="text-[11px] text-slate-400 font-mono">50 ~ 200 px</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={50}
                      max={200}
                      step={5}
                      value={localSettings.gridCardWidth || 96}
                      onChange={(e) => handleUpdate({ gridCardWidth: Number(e.target.value) })}
                      className="flex-1 accent-[#ec5b13] cursor-pointer"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={50}
                        max={200}
                        step={5}
                        value={localSettings.gridCardWidth || 96}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          handleUpdate({ gridCardWidth: isNaN(v) ? 96 : Math.min(200, Math.max(50, v)) });
                        }}
                        className="w-20 text-center text-sm font-mono font-bold text-[#ec5b13] bg-white rounded-lg py-1 outline-none border border-[#ec5b13]/25 focus:border-[#ec5b13] shadow-sm"
                      />
                      <span className="text-xs text-slate-400 font-medium">px</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="sticky bottom-4 z-40 mx-1 sm:mx-2 px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-4 mt-8 bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-lg rounded-2xl pointer-events-none">
          <div className="flex items-center gap-2 text-xs font-medium pointer-events-auto">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 ${
                saved
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-sm'
                  : 'bg-slate-50 text-slate-400 border border-slate-100'
              }`}
            >
              <CheckCircle className={`w-3.5 h-3.5 ${saved ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
              <span>{saved ? (t.saved || '已保存') : (t.autoSavedTip || '设置已实时自动保存')}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all shadow-sm pointer-events-auto text-xs sm:text-sm"
          >
            {t.reset}
          </button>
        </footer>
      </div>

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
