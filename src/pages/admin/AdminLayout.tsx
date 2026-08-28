/**
 * 后台管理布局
 * NOTE: 左侧导航 + 右侧内容区域，移动端响应式折叠
 */

import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { Settings, Tags, RefreshCw, Home, Menu, X, Image as ImageIcon, MessageCircle, BookOpen, ExternalLink, Github } from 'lucide-react';
import { useData } from '../../context/DataContext.tsx';
import { TRANSLATIONS } from '../../i18n/translations.ts';

export default function AdminLayout() {
  const { state } = useData();
  const t = TRANSLATIONS[state.settings.language || 'zh-CN'];
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NAV_ITEMS = [
    { to: '/admin/settings', icon: Settings, label: t.navPersonalization },
    { to: '/admin/bookmarks', icon: Tags, label: t.navBookmarks },
    { to: '/admin/wallpaper', icon: ImageIcon, label: t.navWallpaper },
    { to: '/admin/backup', icon: RefreshCw, label: t.navBackup },
    { to: '/admin/feedback', icon: t.navFeedback.includes('反馈') ? MessageCircle : MessageCircle, label: t.navFeedback },
  ];

  // 简单的路由守卫
  useEffect(() => {
    const isAuth = sessionStorage.getItem('yunest_auth') === 'true';
    if (!isAuth) {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-[#f8f6f6] text-slate-900 font-sans admin-scrollbar">
      {/* 移动端遮罩层 */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-64 border-r border-slate-200 bg-white flex flex-col z-50
          transition-transform duration-300 lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* 品牌标识与返回首页入口 */}
        <div className="p-4 border-b border-slate-100">
          <Link
            to="/"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all duration-200 group"
            title={t.backToHome}
          >
            <div className="w-10 h-10 rounded-xl bg-[#ec5b13] flex items-center justify-center overflow-hidden shadow-md shadow-[#ec5b13]/20 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-[#ec5b13]/30 transition-all duration-200 shrink-0">
              <img src="/favicon.svg" alt="logo" className="w-6 h-6 filter brightness-0 invert" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold tracking-tight text-slate-900 truncate group-hover:text-[#ec5b13] transition-colors">
                {state.settings.siteName}
              </h1>
              <p className="text-xs text-slate-400 font-medium group-hover:text-slate-500 transition-colors">{t.siteNav}</p>
            </div>
          </Link>
        </div>

        {/* 导航链接 */}
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-[#ec5b13]/10 text-[#ec5b13] font-bold'
                    : 'text-slate-600 hover:bg-[#ec5b13]/5 hover:text-[#ec5b13] font-medium'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* 侧边栏底部操作区 */}
        <div className="p-4 border-t border-slate-100">
          <a
            href="https://navdocs.072199.xyz/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-500 hover:bg-[#ec5b13]/5 hover:text-[#ec5b13] transition-all duration-200 font-medium group"
            title={t.docsTooltip}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-[#ec5b13]" />
              <span className="text-sm font-semibold">{t.docSite}</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </aside>

      {/* 主内容区域 */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* 移动端顶栏 */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#ec5b13] flex items-center justify-center overflow-hidden">
                <img src="/favicon.svg" alt="logo" className="w-5 h-5 filter brightness-0 invert" />
              </div>
              <span className="text-sm font-bold text-slate-900">{state.settings.siteName}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              title={t.backToHome}
            >
              <Home className="w-3.5 h-3.5" />
              <span>{t.backToHome}</span>
            </Link>
            <a
              href="https://navdocs.072199.xyz/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#ec5b13] bg-[#ec5b13]/10 hover:bg-[#ec5b13]/20 transition-colors"
              title={t.docsTooltip}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t.docSite}</span>
            </a>
          </div>
        </div>

        <main className="flex-1 min-w-0 overflow-auto flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          
          {/* 全局后台页脚 */}
          <footer className="w-full max-w-4xl mx-auto px-6 sm:px-8 py-10 mt-auto">
            <div className="border-t border-slate-200/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                <a
                  href="https://navdocs.072199.xyz/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#ec5b13] transition-colors inline-flex items-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{t.docSite}</span>
                </a>
                <span className="text-slate-200">|</span>
                <a
                  href="https://github.com/YUME-0721/YuNest"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-700 transition-colors inline-flex items-center gap-1"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub</span>
                </a>
              </div>
              <p className="text-slate-400 text-[10px] sm:text-xs font-semibold tracking-wider uppercase">
                {t.builtBy}
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
