/**
 * 后台管理布局
 * NOTE: 左侧导航 + 右侧内容区域，移动端响应式折叠
 */

import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { Settings, Tags, RefreshCw, Home, Menu, X, Image as ImageIcon } from 'lucide-react';
import { useData } from '../../context/DataContext.tsx';

const NAV_ITEMS = [
  { to: '/admin/settings', icon: Settings, label: '个性化设置' },
  { to: '/admin/bookmarks', icon: Tags, label: '管理标签' },
  { to: '/admin/wallpaper', icon: ImageIcon, label: '壁纸与背景' },
  { to: '/admin/backup', icon: RefreshCw, label: '备份与还原' },
];

export default function AdminLayout() {
  const { state } = useData();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        {/* 品牌标识 */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-[#ec5b13] flex items-center justify-center overflow-hidden shadow-lg shadow-[#ec5b13]/20">
            <img src="/favicon.svg" alt="logo" className="w-7 h-7 filter brightness-0 invert" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{state.settings.siteName}</h1>
            <p className="text-xs text-slate-500 font-medium">导航页</p>
          </div>
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

        {/* 返回首页 */}
        <div className="p-4 border-t border-slate-100">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all duration-200 font-medium"
          >
            <Home className="w-5 h-5" />
            <span className="text-sm">返回首页</span>
          </Link>
        </div>
      </aside>

      {/* 主内容区域 */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* 移动端顶栏 */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#ec5b13] flex items-center justify-center overflow-hidden">
              <img src="/favicon.svg" alt="logo" className="w-5 h-5 filter brightness-0 invert" />
            </div>
            <span className="text-sm font-bold">{state.settings.siteName}</span>
          </div>
        </div>

        <main className="flex-1 min-w-0 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
