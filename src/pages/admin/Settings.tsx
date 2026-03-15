/**
 * 个性化设置页面
 * NOTE: 管理网站名称、搜索引擎、壁纸配置（固定/API/本地上传）、视觉效果
 */

import React, { useState, useRef } from 'react';
import { useData, PRESET_SEARCH_ENGINES } from '../../context/DataContext.tsx';
import { Settings as SettingsIcon, Image as ImageIcon, Search, CheckCircle, Upload, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Settings() {
  const { state, updateSettings } = useData();
  const [localSettings, setLocalSettings] = useState(state.settings);
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
      alert('图片大小不能超过 5MB');
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
          <h2 className="text-3xl font-black tracking-tight text-slate-900">个性化设置</h2>
          <p className="text-slate-500 mt-2">定制您的站点基础信息与默认搜索体验</p>
        </div>
      </header>

      <div className="space-y-12">
        {/* 基本设置 */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <SettingsIcon className="w-5 h-5 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">基本设置</h3>
          </div>
          <div className="grid gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">网站名称</label>
              <input
                type="text"
                id="setting-site-name"
                className="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none border transition-colors"
                placeholder="请输入网站名称"
                value={localSettings.siteName}
                onChange={(e) => setLocalSettings({ ...localSettings, siteName: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-4">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                默认搜索引擎
              </label>
              
              {/* 预设搜索引擎图标选择 */}
              <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 mb-2">
                {PRESET_SEARCH_ENGINES.map((engine) => (
                  <button
                    key={engine.id}
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, searchEngine: engine.url })}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
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
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-400">手动输入搜索地址</p>
                <input
                  type="text"
                  id="setting-search-engine"
                  className="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none border transition-colors text-sm"
                  placeholder="例如: https://www.google.com/search?q="
                  value={localSettings.searchEngine}
                  onChange={(e) => setLocalSettings({ ...localSettings, searchEngine: e.target.value })}
                />
                <p className="text-xs text-slate-400">设置后，首页搜索栏点击图标切换将以这里的设置作为默认参考</p>
              </div>
            </div>
          </div>
        </section>

        {/* 保存栏 - 移除背景和边框，仅保留按钮悬浮 */}
        <footer className="sticky bottom-0 left-0 right-0 z-40 -mx-6 sm:-mx-8 px-6 sm:px-8 py-6 flex justify-end gap-4 mt-8 pointer-events-none">
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
                已保存
              </>
            ) : (
              '保存设置'
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
