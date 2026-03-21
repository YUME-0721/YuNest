/**
 * YuNest 应用路由配置
 * NOTE: 使用 HashRouter 以兼容 Cloudflare Pages / EdgeOne 等静态托管平台
 */

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext.tsx';
import Home from './pages/Home.tsx';
import AdminLayout from './pages/admin/AdminLayout.tsx';
import Settings from './pages/admin/Settings.tsx';
import Bookmarks from './pages/admin/Bookmarks.tsx';
import Wallpaper from './pages/admin/Wallpaper.tsx';
import Backup from './pages/admin/Backup.tsx';
import Feedback from './pages/admin/Feedback.tsx';

export default function App() {
  return (
    <DataProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/settings" replace />} />
            <Route path="settings" element={<Settings />} />
            <Route path="bookmarks" element={<Bookmarks />} />
            <Route path="wallpaper" element={<Wallpaper />} />
            <Route path="backup" element={<Backup />} />
            <Route path="feedback" element={<Feedback />} />
          </Route>
        </Routes>
      </HashRouter>
    </DataProvider>
  );
}
