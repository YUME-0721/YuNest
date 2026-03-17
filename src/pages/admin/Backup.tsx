/**
 * 备份与还原页面
 * NOTE: 支持 JSON 格式数据的导入/导出，含数据统计和文件格式验证
 */

import React, { useRef, useState } from 'react';
import { useData } from '../../context/DataContext.tsx';
import { UploadCloud, Download, AlertTriangle, CheckCircle, FileJson, Database, Cloud } from 'lucide-react';

export default function Backup() {
  const { state, importData, exportData, syncToRepo, fetchFromRepo, updateSettings } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // 数据统计
  const totalBookmarks = state.categories.reduce((acc, cat) => acc + cat.bookmarks.length, 0);

  const handlePushToRepo = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus('idle');
      await syncToRepo();
      setSyncStatus('success');
      setSyncMessage('成功推送到仓库 (yunest_data.json)');
    } catch (e: any) {
      setSyncStatus('error');
      setSyncMessage(e.message || '推送失败');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handlePullFromRepo = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus('idle');
      await fetchFromRepo();
      setSyncStatus('success');
      setSyncMessage('成功从仓库拉取并覆盖本地数据');
    } catch (e: any) {
      setSyncStatus('error');
      setSyncMessage(e.message || '拉取失败');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsedData = JSON.parse(content);

        // 数据格式验证
        if (parsedData.settings && parsedData.categories && Array.isArray(parsedData.categories)) {
          importData(parsedData);
          setImportStatus('success');
          setImportMessage(`成功导入 ${parsedData.categories.length} 个分类，${
            parsedData.categories.reduce((acc: number, cat: { bookmarks: unknown[] }) => acc + cat.bookmarks.length, 0)
          } 个书签`);
        } else {
          setImportStatus('error');
          setImportMessage('无效的备份文件格式，请检查文件内容');
        }
      } catch (error) {
        console.error('Import error:', error);
        setImportStatus('error');
        setImportMessage('解析文件失败，请确保文件是有效的 JSON 格式');
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // 3 秒后清除状态提示
    setTimeout(() => {
      setImportStatus('idle');
      setImportMessage('');
    }, 3000);
  };

  /** 处理文件拖拽 */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.json')) {
      // NOTE: 复用文件读取逻辑
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
      <header className="mb-10">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">备份与还原</h2>
        <p className="text-slate-500">管理您的数据，支持 JSON 格式的备份与还原</p>
      </header>

      {/* 数据统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Database className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">分类数</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{state.categories.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <FileJson className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">书签数</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalBookmarks}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">数据大小</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {(new Blob([JSON.stringify(state)]).size / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* 云端同步 (GitHub 仓库) */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Cloud className="w-6 h-6 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">云端同步</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2">GitHub Token</label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors"
                placeholder="ghp_xxx (需 repo 权限)"
                value={state.settings.githubToken || ''}
                onChange={(e) => updateSettings({ githubToken: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">GitHub 仓库</label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors"
                placeholder="例如: YUME-0721/YuNest"
                value={state.settings.githubRepo || ''}
                onChange={(e) => updateSettings({ githubRepo: e.target.value })}
              />
            </div>
          </div>

          {syncStatus !== 'idle' && (
            <div
              className={`flex items-center gap-2 p-4 rounded-xl mb-6 text-sm font-medium animate-fade-in ${
                syncStatus === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-100'
                  : 'bg-red-50 text-red-700 border border-red-100'
              }`}
            >
              {syncStatus === 'success' ? (
                <CheckCircle className="w-5 h-5 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0" />
              )}
              {syncMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handlePushToRepo}
              disabled={isSyncing || !state.settings.githubToken || !state.settings.githubRepo}
              className="py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UploadCloud className="w-4 h-4" />
              推送到仓库 (Push)
            </button>
            <button
              onClick={handlePullFromRepo}
              disabled={isSyncing || !state.settings.githubToken || !state.settings.githubRepo}
              className="py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              从仓库拉取 (Pull)
            </button>
          </div>
        </section>

        {/* 本地备份 (导入与导出整合) */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-6 h-6 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">本地备份</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 导入子区域 */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">导入数据</h4>
              {importStatus !== 'idle' && (
                <div className={`p-3 rounded-xl text-xs font-medium ${importStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {importMessage}
                </div>
              )}
              <div
                className="border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center py-8 bg-slate-50/30 hover:border-[#ec5b13]/30 transition-all cursor-pointer group"
                onClick={handleImportClick}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <UploadCloud className="w-6 h-6 text-slate-300 mb-2 group-hover:text-[#ec5b13] transition-colors" />
                <p className="text-xs text-slate-500 font-medium">点击或拖拽 JSON 导入</p>
                <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              </div>
            </div>

            {/* 导出子区域 */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">导出数据</h4>
              <div className="bg-slate-50 rounded-2xl p-4 h-[92px] overflow-hidden relative">
                <pre className="text-[10px] text-slate-400 font-mono leading-tight">
                  {JSON.stringify({
                    version: '1.0.0',
                    exportTime: new Date().toISOString().split('T')[0],
                    categories: state.categories.length,
                    bookmarks: totalBookmarks,
                  }, null, 2)}
                </pre>
                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-50 to-transparent" />
              </div>
              <button
                onClick={exportData}
                className="w-full py-3 bg-white border border-slate-200 text-slate-700 hover:border-[#ec5b13] hover:text-[#ec5b13] rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                下载备份文件 (.json)
              </button>
            </div>
          </div>
        </section>

        {/* 危险区域 */}
        <section className="bg-red-50 rounded-2xl p-6 sm:p-8 border border-red-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-xl font-bold text-red-600">危险区域</h3>
              </div>
              <p className="text-sm text-red-800/70">
                重置将清除所有配置和书签数据，此操作不可逆，请确保已备份数据。
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('确定要重置所有数据吗？此操作不可恢复！')) {
                  localStorage.removeItem('yunest_data');
                  window.location.reload();
                }
              }}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors whitespace-nowrap shadow-lg shadow-red-600/10"
            >
              重置站点设置
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
