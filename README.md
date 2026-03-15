<div align="center">
  <img alt="YuNest Logo" src="https://img.shields.io/badge/Yu-Nest-ec5b13?style=for-the-badge&logoColor=white" />
  <h1>YuNest - 个人导航主页</h1>
  <p>一个现代、美观且高度可定制的个人静态导航与书签管理工具。</p>
</div>

![Home Screenshot](screenshots/homepage.png)

## ✨ 特性 (Features)

YuNest 专注于提供最优雅的起始页体验，所有内容均保存在浏览器本地，无需后台数据库。

- 🎨 **极具美感的设计**: 采用毛玻璃（Glassmorphism）与弥散光风格设计，搭配丝滑流畅的入场及悬浮微动效，极简而不失质感。
- 🖼️ **强大的壁纸与背景管理**: 
  - 支持 **纯色背景**（可自由调色）、**固定静态图片**、**随机图片 API**，以及 **本地图片上传**。
  - 支持开启/关闭“玻璃拟态模糊”与“深色遮罩”，以确保不同壁纸下的可见性与对比度。
- 🔍 **多引擎搜索集成**: 搜索栏自带引擎切换功能（Google、Bing、百度等），支持在个性化设置中调整默认搜索引擎。
- 🔖 **便捷的书签管理**: 强大的内置分类和书签管理器，书签图标支持自动获取站点 Favicon，也可以直接输入图片链接或使用 Lucide 主题图标。
- 🔐 **安全的后台认证**: 系统自带密码认证的管理后台，可随时在页面右上角点击进入配置界面，支持通过环境变量定制访问密码。
- 💾 **纯客户端持久化与备份**: 所有书签、偏好设置完全基于浏览器的 `localStorage` 实现。内置 JSON 数据的备份与还原功能，方便跨设备迁移。
- 🚀 **零依赖一键部署**: 本身采用 `HashRouter` 设计完美适配静态托管平台，部署至 Cloudflare Pages、Vercel 及 GitHub Pages 时无需进行任何额外重定向配置。

## 🛠️ 技术栈 (Tech Stack)

- **框架**: [React 18](https://react.dev/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **样式**: [Tailwind CSS v4](https://tailwindcss.com/)
- **路由**: [React Router](https://reactrouter.com/) (HashRouter)
- **图标集**: [Lucide React](https://lucide.dev/)

## 🚀 部署与使用 (Deployment & Usage)

因为 YuNest 是一个纯前端的静态应用，你可以非常轻松地将其跑在本地或是部署在任何静态托管云服务上。

### 1. 本地运行开发环境

**前置依赖准备项**: 确保您的本地环境已有 Node.js 环境（推荐 Node v18+）。

```bash
# 1. 克隆代码仓库
git clone <your-repo-url>
cd YuNest

# 2. 安装项目依赖
npm install

# 3. 配置认证环境变量（可选）
# 将密码更新为您自己的后台访问密码，如果不更改，默认密码将是 123456
cp .env.example .env
# 编辑 .env 文件，修改 VITE_ADMIN_PASSWORD 值

# 4. 启动本地开发服务
npm run dev
```

启动后，访问提示的 `http://localhost:5173` 地址即可。

### 2. 构建生产静态文件

如果需要在您自己的服务器上部署：

```bash
npm run build
```
执行后会在根目录生成一个 `dist` 文件夹，将此文件夹内的内容直接放到各种 Web Server（如 Nginx、Apache）的根目录下访问即可。

### 3. 一键静态托管部署推荐

你可以直接将该项目的仓库导入以下常见平台，完全免费且配置简单：
- **Cloudflare Pages / Vercel / Netlify**:
  - `Build Command` (构建命令): `npm run build`
  - `Output Directory` (输出目录): `dist`
  - *补充：必须在平台提供的 Environment Variables 中增设 `VITE_ADMIN_PASSWORD` 环境变量以保证后台安全。*

## 📚 使用说明 (How to Use)

1. **访问首页**: 在完成部署后访问站点，此时您看到的就是美观的前台导航看板。
2. **进入后台**: 点击主页右上角的“齿轮”图标，并在弹窗内输入管理员密码（默认为 `123456`，或通过 `.env` 中的 `VITE_ADMIN_PASSWORD` 设置的值）。
3. **个性化配置**: 成功验证后，可以进入后台调整站点名称、更改默认搜索引擎以及管理个性化的壁纸和视觉效果。
4. **管理书签**: 在左侧菜单切至“管理标签”，可以任意增删改书签分类以及子书签链接。
5. **多端同步转移**: 当需要到其他设备上应用同样的配置时，前往“备份与还原”导出您的个人数据 JSON，即可在另一台设备的 YuNest 中一键导入还原。

## 📄 许可申明 (License)

本项目基于 **MIT** License 开源。
