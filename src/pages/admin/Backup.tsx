/**
 * 备份与还原页面
 * NOTE: 支持 JSON 格式数据的导入/导出，含数据统计和文件格式验证
 */

import React, { useRef, useState } from 'react';
import { useData } from '../../context/DataContext.tsx';
import { UploadCloud, Download, AlertTriangle, CheckCircle, FileJson, Database } from 'lucide-react';

export default function Backup() {
  const { state, importData, exportData } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  // 数据统计
  const totalBookmarks = state.categories.reduce((acc, cat) => acc + cat.bookmarks.length, 0);

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
        {/* 导入数据 */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <UploadCloud className="w-6 h-6 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">导入数据</h3>
          </div>

          {/* 导入状态提示 */}
          {importStatus !== 'idle' && (
            <div
              className={`flex items-center gap-2 p-4 rounded-xl mb-4 text-sm font-medium ${
                importStatus === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-100'
                  : 'bg-red-50 text-red-700 border border-red-100'
              }`}
            >
              {importStatus === 'success' ? (
                <CheckCircle className="w-5 h-5 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0" />
              )}
              {importMessage}
            </div>
          )}

          <div
            className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center py-12 sm:py-16 px-6 bg-slate-50/50 hover:border-[#ec5b13]/50 transition-colors cursor-pointer group"
            onClick={handleImportClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 rounded-full bg-[#ec5b13]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8 text-[#ec5b13]" />
            </div>
            <h4 className="text-lg font-semibold mb-1">点击或拖拽 JSON 文件至此处</h4>
            <p className="text-sm text-slate-500 mb-6">仅支持 .json 格式的备份文件</p>
            <button className="px-8 py-2.5 bg-[#ec5b13] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#ec5b13]/20 hover:bg-[#ec5b13]/90 transition-all">
              选择本地文件
            </button>
            <input
              type="file"
              accept=".json"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
        </section>

        {/* 导出数据 */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Download className="w-6 h-6 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">导出数据</h3>
          </div>
          <div className="flex-1 bg-slate-900 rounded-xl p-4 font-mono text-xs text-green-400 overflow-hidden mb-6 relative max-h-48 overflow-y-auto">
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
            <pre><code>{JSON.stringify({
              version: '1.0.0',
              exportTime: new Date().toISOString(),
              settings: state.settings.siteName,
              categoriesCount: state.categories.length,
              bookmarksCount: totalBookmarks,
            }, null, 2)}</code></pre>
          </div>
          <button
            onClick={exportData}
            className="w-full py-3 border border-[#ec5b13] text-[#ec5b13] hover:bg-[#ec5b13] hover:text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            下载全量备份 (.json)
          </button>
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
