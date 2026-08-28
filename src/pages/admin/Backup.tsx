import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useData } from '../../context/DataContext.tsx';
import { UploadCloud, Download, AlertTriangle, CheckCircle, FileJson, Database, Cloud, RefreshCw, HelpCircle, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations.ts';
import ConfirmModal from '../../components/ConfirmModal.tsx';

export default function Backup() {
  const { state, importData, exportData, syncToRepo, fetchFromRepo, updateSettings } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[state.settings.language || 'zh-CN'];

  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // 云端连接状态测试：'idle' | 'checking' | 'connected' | 'disconnected'
  const [connStatus, setConnStatus] = useState<'idle' | 'checking' | 'connected' | 'disconnected'>('idle');

  // 测试云端同步连通性
  const checkConnection = useCallback(async () => {
    if (!state.settings.githubSync) {
      setConnStatus('idle');
      return;
    }

    setConnStatus('checking');
    // 如果 sessionStorage 还没有，回退读取环境配置密码
    const authPassword = sessionStorage.getItem('yunest_admin_pwd') || (import.meta as any).env.ADMIN_PASSWORD || 'admin1234';

    // 1. 测试边缘代理 /api/sync
    try {
      const res = await fetch('/api/sync', {
        headers: { 'x-auth-password': authPassword },
      });
      if (res.ok) {
        setConnStatus('connected');
        return;
      }
      const data = await res.json().catch(() => ({}));
      // 如果明确是未配置变量或 404 (非边缘部署环境)，转入测试客户端配置
      if (data.code !== 'NOT_CONFIGURED' && res.status !== 404 && res.status !== 405) {
        setConnStatus('disconnected');
        return;
      }
    } catch (e) {
      // 代理不可达
    }

    // 2. 测试本地填写的 Token + 仓库直连
    if (state.settings.githubToken && state.settings.githubRepo) {
      try {
        const ghRes = await fetch(`https://api.github.com/repos/${state.settings.githubRepo}`, {
          headers: {
            Authorization: `Bearer ${state.settings.githubToken}`,
            Accept: 'application/vnd.github+json',
          },
        });
        if (ghRes.ok) {
          setConnStatus('connected');
          return;
        }
      } catch (e) {
        // 直连失败
      }
    }

    setConnStatus('disconnected');
  }, [state.settings.githubSync, state.settings.githubToken, state.settings.githubRepo]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // 数据统计
  const totalBookmarks = state.categories.reduce((acc, cat) => acc + cat.bookmarks.length, 0);

  const handlePushToRepo = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus('idle');
      await syncToRepo();
      setSyncStatus('success');
      setSyncMessage(t.pushSuccess);
      // 推送成功后立即更新连通状态为绿灯
      setConnStatus('connected');
    } catch (e: any) {
      setSyncStatus('error');
      setSyncMessage(e.message || t.syncFailed);
      checkConnection();
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 4000);
    }
  };

  const handlePullFromRepo = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus('idle');
      await fetchFromRepo();
      setSyncStatus('success');
      setSyncMessage(t.pullSuccess);
      setConnStatus('connected');
    } catch (e: any) {
      setSyncStatus('error');
      setSyncMessage(e.message || t.syncFailed);
      checkConnection();
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 4000);
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
          setImportMessage(t.importSuccess);
        } else {
          setImportStatus('error');
          setImportMessage(t.importInvalid);
        }
      } catch (error) {
        console.error('Import error:', error);
        setImportStatus('error');
        setImportMessage(t.importError);
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
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">{t.backupTitle}</h2>
        <p className="text-slate-500">{t.backupDesc}</p>
      </header>

      {/* 数据统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Database className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">{t.categoriesCount}</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{state.categories.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <FileJson className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">{t.bookmarksCount}</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalBookmarks}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">{t.dataSize}</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {(new Blob([JSON.stringify(state)]).size / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* 云端同步 (GitHub 仓库) */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Cloud className={`w-6 h-6 ${state.settings.githubSync ? 'text-[#ec5b13]' : 'text-slate-300'}`} />
              <h3 className="text-xl font-bold">{t.cloudSync}</h3>

              {/* 连通状态指示器 (绿/红 Wifi 图标) */}
              {state.settings.githubSync && (
                <div className="relative group flex items-center">
                  <div
                    onClick={checkConnection}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                      connStatus === 'connected'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80 hover:bg-emerald-100/80'
                        : connStatus === 'disconnected'
                        ? 'bg-rose-50 text-rose-600 border border-rose-200/80 hover:bg-rose-100/80'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                    title={
                      connStatus === 'connected'
                        ? t.syncConnectedTip
                        : connStatus === 'disconnected'
                        ? t.syncDisconnectedTip
                        : t.syncCheckingTip
                    }
                  >
                    {connStatus === 'connected' && <Wifi className="w-3.5 h-3.5" />}
                    {connStatus === 'disconnected' && <WifiOff className="w-3.5 h-3.5" />}
                    {connStatus === 'checking' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  </div>
                  {/* Tooltip 气泡 */}
                  <div className="absolute left-0 top-full mt-1.5 hidden group-hover:flex items-center px-3 py-1.5 bg-slate-900/95 text-white text-xs font-medium rounded-xl whitespace-nowrap shadow-2xl backdrop-blur-md z-50 pointer-events-none transition-all leading-relaxed border border-white/10">
                    {connStatus === 'connected'
                      ? t.syncConnectedTip
                      : connStatus === 'disconnected'
                      ? t.syncDisconnectedTip
                      : t.syncCheckingTip}
                  </div>
                </div>
              )}

              {/* 帮助问号 */}
              <div className="relative group flex items-center">
                <div
                  className="p-1 rounded-full text-slate-400 hover:text-[#ec5b13] hover:bg-[#ec5b13]/10 transition-colors cursor-help"
                  title={t.proxySyncDesc}
                >
                  <HelpCircle className="w-4 h-4" />
                </div>
                {/* Tooltip 气泡 */}
                <div className="absolute left-0 top-full mt-1.5 hidden group-hover:flex items-center px-3 py-2 bg-slate-900/95 text-white text-xs font-medium rounded-xl w-72 sm:w-80 shadow-2xl backdrop-blur-md z-50 pointer-events-none transition-all leading-relaxed border border-white/10">
                  {t.proxySyncDesc}
                </div>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ githubSync: !state.settings.githubSync })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                state.settings.githubSync ? 'bg-[#ec5b13]' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  state.settings.githubSync ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className={`transition-all duration-300 ${state.settings.githubSync ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale-[0.5]'}`}>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                {t.syncToken}
              </label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors placeholder:text-slate-300"
                placeholder="ghp_xxx (若服务端已配置可留空)"
                value={state.settings.githubToken || ''}
                onChange={(e) => updateSettings({ githubToken: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                {t.syncRepo}
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors placeholder:text-slate-300"
                placeholder="User/Repo (若服务端已配置可留空)"
                value={state.settings.githubRepo || ''}
                onChange={(e) => updateSettings({ githubRepo: e.target.value })}
              />
            </div>
          </div>

          {/* 自动同步开关 */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-6">
            <div className="flex items-center gap-2">
              <div className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <RefreshCw className={`w-4 h-4 ${state.settings.autoSync ? 'text-[#ec5b13]' : 'text-slate-400'}`} />
                {t.autoSyncLabel}
              </div>
              <div className="relative group flex items-center">
                <div
                  className="p-1 rounded-full text-slate-400 hover:text-[#ec5b13] hover:bg-[#ec5b13]/10 transition-colors cursor-help"
                  title={t.autoSyncDesc}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </div>
                {/* Tooltip 气泡 */}
                <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:flex items-center px-3 py-1.5 bg-slate-900/95 text-white text-xs font-medium rounded-xl w-64 sm:w-72 shadow-2xl backdrop-blur-md z-50 pointer-events-none transition-all leading-relaxed border border-white/10">
                  {t.autoSyncDesc}
                </div>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ autoSync: !state.settings.autoSync })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                state.settings.autoSync ? 'bg-[#ec5b13]' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  state.settings.autoSync ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
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
              disabled={isSyncing}
              className="py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UploadCloud className="w-4 h-4" />
              {t.pushData}
            </button>
            <button
              onClick={handlePullFromRepo}
              disabled={isSyncing}
              className="py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {t.pullData}
            </button>
          </div>
          </div>
        </section>

        {/* 本地备份 (导入与导出整合) */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-6 h-6 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">{t.localBackup}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 导入子区域 */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t.importDataLabel}</h4>
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
                <p className="text-xs text-slate-500 font-medium">{t.dragDropImport}</p>
                <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              </div>
            </div>

            {/* 导出子区域 */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t.exportDataLabel}</h4>
              <div className="bg-slate-50 rounded-2xl p-4 h-[92px] overflow-hidden relative">
                <pre className="text-[10px] text-slate-400 font-mono leading-tight">
                  {JSON.stringify({
                    version: '1.1.0',
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
                {t.downloadBackup}
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
                <h3 className="text-xl font-bold text-red-600">{t.dangerZone}</h3>
              </div>
              <p className="text-sm text-red-800/70">
                {t.dangerZoneDesc}
              </p>
            </div>
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors whitespace-nowrap shadow-lg shadow-red-600/10"
            >
              {t.resetSiteLabel}
            </button>
          </div>
        </section>
      </div>

      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={() => {
          localStorage.removeItem('yunest_data');
          window.location.reload();
        }}
        title={t.dangerZone}
        message={t.resetConfirm}
        confirmText={t.reset}
        cancelText={t.cancel}
        type="danger"
      />
    </div>
  );
}
