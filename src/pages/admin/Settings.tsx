/**
 * 个性化设置页面
 * NOTE: 管理网站名称、搜索引擎、壁纸配置（固定/API/本地上传）、视觉效果
 */

import React, { useState, useRef } from 'react';
import { useData, PRESET_SEARCH_ENGINES } from '../../context/DataContext.tsx';
import { Settings as SettingsIcon, Image as ImageIcon, Search, CheckCircle, Upload, RefreshCw, Clock, Globe } from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations.ts';

export default function Settings() {
  const { state, updateSettings } = useData();
  const [localSettings, setLocalSettings] = useState(state.settings);
  const t = TRANSLATIONS[state.settings.language || 'zh-CN'];
  const [saved, setSaved] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(state.settings.wallpaperUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setLocalSettings(state.settings);
    setPreviewUrl(state.settings.wallpaperUrl);
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
    <div className="max-w-4xl mx-auto p-6 sm:p-8 space-y-8">
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
          <div className="grid gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
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
          <div className="grid gap-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
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

        {/* 时钟设置 */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">{t.clockSettings}</h3>
          </div>
          <div className="grid gap-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400" />
                {t.timezoneLabel}
              </label>
              <input
                type="text"
                list="timezone-list"
                className="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none border transition-colors text-sm"
                placeholder={t.timezonePlaceholder}
                value={localSettings.timezone}
                onChange={(e) => setLocalSettings({ ...localSettings, timezone: e.target.value })}
              />
              <datalist id="timezone-list">
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
              </datalist>
              <p className="text-xs text-slate-400">{t.timezoneDesc}</p>
            </div>
          </div>
        </section>

        <footer className="sticky bottom-0 left-0 right-0 z-40 -mx-6 sm:-mx-8 px-6 sm:px-8 py-6 flex justify-end gap-4 mt-8 pointer-events-none">
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-3 rounded-xl font-bold bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all shadow-sm pointer-events-auto"
          >
            {t.reset}
          </button>
          <button
            onClick={handleSave}
            className={`px-8 py-3 rounded-xl font-bold shadow-2xl transition-all flex items-center gap-2 pointer-events-auto ${
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
    </div>
  );
}
