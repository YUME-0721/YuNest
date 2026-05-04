/**
 * 壁纸与背景设置页面
 * NOTE: 管理壁纸配置（固定/API/本地上传/纯色）、视觉效果
 */

import React, { useState, useRef } from 'react';
import { useData, DEFAULT_SETTINGS } from '../../context/DataContext.tsx';
import { Image as ImageIcon, CheckCircle, Upload, RefreshCw } from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations.ts';
import ConfirmModal from '../../components/ConfirmModal.tsx';

export default function Wallpaper() {
  const { state, updateSettings } = useData();
  const [localSettings, setLocalSettings] = useState(state.settings);
  const t = TRANSLATIONS[state.settings.language || 'zh-CN'];
  const [saved, setSaved] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(state.settings.wallpaperUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

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
    <div className="max-w-4xl mx-auto p-6 sm:p-8 space-y-8 text-slate-900">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">{t.wallpaperTitle}</h2>
          <p className="text-slate-500 mt-2">{t.wallpaperDesc}</p>
        </div>
      </header>

      <div className="space-y-12 pb-24">
        {/* 壁纸预览和类型选择 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 预览区 */}
            <div 
              className="aspect-video rounded-xl bg-slate-100 relative group overflow-hidden border border-slate-200"
              style={localSettings.wallpaperType === 'color' ? { backgroundColor: localSettings.backgroundColor } : {}}
            >
              {localSettings.wallpaperType === 'color' ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg border border-white/20 text-white text-xs font-medium">
                    {t.previewLabel}: {localSettings.backgroundColor}
                  </div>
                </div>
              ) : (
                <>
                  {getEffectivePreviewUrl() ? (
                    <img
                      src={getEffectivePreviewUrl()}
                      alt={t.previewLabel}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                </>
              )}
              {localSettings.wallpaperType !== 'color' && (
                <button
                  onClick={refreshPreview}
                  className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/40 text-white/80 hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
                  title={t.previewLabel}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 配置区 */}
            <div className="flex flex-col gap-4">
              {/* 壁纸类型 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-sm font-semibold mb-2">{t.wallpaperType}</p>
                <select
                  id="setting-wallpaper-type"
                  className="w-full rounded-lg border-slate-200 bg-white px-3 py-2.5 text-sm outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors font-medium"
                  value={localSettings.wallpaperType}
                  onChange={(e) => {
                    const type = e.target.value as 'fixed' | 'api' | 'local' | 'color';
                    setLocalSettings({ ...localSettings, wallpaperType: type });
                    if (type === 'local') {
                      setPreviewUrl(localSettings.localWallpaper);
                    } else if (type === 'color') {
                      setPreviewUrl('');
                    } else {
                      setPreviewUrl(localSettings.wallpaperUrl);
                    }
                  }}
                >
                  <option value="fixed">{t.typeFixed}</option>
                  <option value="api">{t.typeApi}</option>
                  <option value="local">{t.typeLocal}</option>
                  <option value="color">{t.typeColor}</option>
                </select>
              </div>

              {/* 根据类型显示不同的输入 */}
              {localSettings.wallpaperType === 'local' ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm font-semibold mb-2">{t.typeLocal}</p>
                  <div
                    className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-[#ec5b13]/40 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-500">{t.uploadLabel}</p>
                    <p className="text-[10px] text-slate-400 mt-1">支持 JPG/PNG/WebP, {t.uploadLimit}</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLocalWallpaper}
                  />
                </div>
              ) : localSettings.wallpaperType === 'color' ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm font-semibold mb-3">{t.bgColorLabel}</p>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      id="setting-bg-color"
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                      value={localSettings.backgroundColor}
                      onChange={(e) => setLocalSettings({ ...localSettings, backgroundColor: e.target.value })}
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        className="w-full rounded-lg border-slate-200 bg-white px-3 py-2 text-sm outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors font-mono"
                        value={localSettings.backgroundColor}
                        onChange={(e) => setLocalSettings({ ...localSettings, backgroundColor: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm font-semibold mb-2">
                    {localSettings.wallpaperType === 'api' ? t.typeApi : t.imageUrlLabel}
                  </p>
                  <input
                    type="text"
                    id="setting-wallpaper-url"
                    className="w-full rounded-lg border-slate-200 bg-white px-3 py-2.5 text-sm outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors placeholder:text-slate-300 font-medium"
                    placeholder="https://..."
                    value={localSettings.wallpaperUrl}
                    onChange={(e) => {
                      setLocalSettings({ ...localSettings, wallpaperUrl: e.target.value });
                      setPreviewUrl(e.target.value);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 视觉效果开关 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
            <div className="flex flex-col gap-4 p-4 rounded-xl border border-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold">{t.glassEffectLabel}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{t.glassEffectDesc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={localSettings.glassEffect}
                    onChange={(e) => setLocalSettings({ ...localSettings, glassEffect: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ec5b13]" />
                </label>
              </div>
              {localSettings.glassEffect && (
                <div className="space-y-2 animate-fade-in">
                  <div className="flex justify-between items-center text-[11px] font-medium text-slate-500">
                    <span>{t.glassOpacityLabel}</span>
                    <span className="font-mono">{localSettings.glassEffectOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#ec5b13]"
                    value={localSettings.glassEffectOpacity}
                    onChange={(e) => setLocalSettings({ ...localSettings, glassEffectOpacity: parseInt(e.target.value) })}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 p-4 rounded-xl border border-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold">{t.darkMaskLabel}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{t.darkMaskDesc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={localSettings.darkMask}
                    onChange={(e) => setLocalSettings({ ...localSettings, darkMask: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ec5b13]" />
                </label>
              </div>
              {localSettings.darkMask && (
                <div className="space-y-2 animate-fade-in">
                  <div className="flex justify-between items-center text-[11px] font-medium text-slate-500">
                    <span>{t.maskOpacityLabel}</span>
                    <span className="font-mono">{localSettings.darkMaskOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#ec5b13]"
                    value={localSettings.darkMaskOpacity}
                    onChange={(e) => setLocalSettings({ ...localSettings, darkMaskOpacity: parseInt(e.target.value) })}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 保存栏 */}
        <footer className="sticky bottom-0 left-0 right-0 z-40 -mx-6 sm:-mx-8 px-6 sm:px-8 py-4 sm:py-6 flex justify-end gap-3 sm:gap-4 mt-8 bg-white/80 backdrop-blur-md border-t border-slate-100 sm:bg-transparent sm:backdrop-blur-none sm:border-0 pointer-events-none">
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
