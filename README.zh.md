<div align="center">
    <p>
        简体中文 | <a href="README.md">English</a>
    </p>
    <p align="center">
    <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
    <img src="https://img.shields.io/badge/Cloudflare_Pages-F38020?style=for-the-badge&logo=cloudflare-pages&logoColor=white" alt="Cloudflare" />
  </p>
  <h1>YuNest - 个人导航主页</h1>
  <p>一个现代、美观且高度可定制的个人静态导航与书签管理工具。</p>
  <p>因为 YuNest 是一个纯前端的静态应用，你可以轻松进行 <a href="#-本地运行与开发-local-development">本地部署</a> 或 <a href="#-静态托管云部署-cloud-deployment">静态托管云部署</a>（点击跳转）。</p>
</div>

![Home Screenshot](screenshots/homepage.png)

## ✨ 特性 (Features)

YuNest 专注于提供最优雅的起始页体验，所有内容均保存在浏览器本地，无需后台数据库。

- 🎨 **极具美感的设计**: 采用毛玻璃（Glassmorphism）与弥散光风格设计，搭配丝滑流畅的入场及悬浮微动效，极简而不失质感。
- 🖼️ **强大的壁纸与背景管理**: 
  - 支持 **纯色背景**（可自由调色）、**固定静态图片**、**随机图片 API**，以及 **本地图片上传**。
  - 支持开启/关闭“玻璃拟态模糊”与“深色遮罩”，以确保不同壁纸下的可见性与对比度。
- 🔍 **多引擎搜索集成**: 搜索栏自带引擎切换功能（Google、Bing、百度等），同时支持 **本地书签实时检索**：输入即过滤，无需回车即可瞬间定位您的本地站点。
- 🔖 **灵活的书签管理与展示**: 
  - 支持 **多样化布局**：可在“展开卡片”（带详细描述和侧边外链图标）与“紧凑宫格”（类应用抽屉的密集图标排列）之间按分组灵活切换，兼顾美观与效率。
  - 书签图标支持自动抓取站点 Favicon，也支持手动填写图片 URL 或使用 Lucide 图标集。
  - **内外网双地址支持**: 支持为站点同时配置“默认地址”与“内网地址”，通过首页 **右键菜单** 即可自由切换访问链路，满足 NAS/HomeLab 用户的特殊需求。
- 🔐 **分组可见性控制与隐私保护**:
  - 支持 **隐藏分组**：可将特定书签分类设置为“隐藏”。隐藏的分组及其内容在未认证状态下对访客完全不可见，仅在管理员登录认证后才会动态出现在首页，不仅是管理后台的隔离，更是首页级的隐私防护。
- 🛡️ **安全的后台认证**: 系统自带密码认证的管理后台，可随时在页面右上角点击进入配置界面，支持通过环境变量定制访问密码。
- 💾 **云端同步与持久化支撑**: 
  - 所有数据默认存储于浏览器 `localStorage`，支持 JSON 文件的手动备份与还原。
  - **集成 GitHub API**：支持一键将数据推送到仓库的 `data/yunest_data.json`（推荐），通过配置“构建忽略路径”实现数据更新与代码部署的完美分离。
- 🚀 **性能与体验优化**: 
  - **图标零延迟加载**: 采用自动图标固化技术与快速 CDN 缓存，确保即便在网络波动时也能瞬间呈现所有书签图标。
  - **零依赖一键部署**: 本身采用 `HashRouter` 设计完美适配静态托管平台，部署至 Cloudflare Pages、Vercel 及 GitHub Pages 时无需进行任何额外重定向配置。

## 🛠️ 技术栈 (Tech Stack)

- **框架**: [React 18](https://react.dev/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **样式**: [Tailwind CSS v4](https://tailwindcss.com/)
- **路由**: [React Router](https://reactrouter.com/) (HashRouter)
- **图标集**: [Lucide React](https://lucide.dev/)

---

## 🚀 部署与使用 (Deployment & Usage)

YuNest 提供了极简的部署流程，您可以根据需求选择在本地运行开发或直接部署到云端。

### 💻 本地运行与开发 (Local Development)

适用于希望深入定制代码、在局域网私有化运行或进行二次开发的用户。

1. **环境准备**: 确保您的电脑已安装 [Node.js](https://nodejs.org/)（推荐 v18+ 版本）。
2. **克隆代码**:
   ```bash
   git clone https://github.com/YUME-0721/YuNest.git
   cd YuNest
   ```
3. **安装依赖**:
   ```bash
   npm install
   ```
4. **配置环境变量**:
   - 复制根目录下的 `.env.example` 并重命名为 `.env`。
   - **VITE_ADMIN_PASSWORD**: 设置您的后台管理密码（必填，默认 `123456`）。
   - **VITE_GITHUB_TOKEN / REPO**: 如果您希望新设备打开即用，可在此预填 GitHub 同步信息。
5. **启动开发服务**:
   ```bash
   npm run dev
   ```
   - 启动后访问控制台输出的 `http://localhost:5173` 即可。

---

### ☁️ 静态托管云部署 (Cloud Deployment)

这是**最推荐**的部署方式。YuNest 作为一个纯静态应用，无需任何服务器成本，可永久免费运行。

#### 1. 快捷云端部署 (推荐 Cloudflare Pages / Vercel)
1. **Fork 本仓库**: 点击右上角的 **Fork**，将代码同步到您自己的 GitHub 账号下（推荐Fork成Private 仓库，可以隐藏个人书签数据）。
2. **导入项目**: 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) 或 Vercel，选择从 Git 导入刚才 Fork 的仓库。
3. **配置构建指令**:
   - **框架预设**: 选择 `Vite` 或 `None`。
   - **构建命令 (Build Command)**: `npm run build`
   - **输出目录 (Output Directory)**: `dist`
4. **设置环境变量 (关键)**:
   - 在部署平台的 **Environment Variables** 设置中，新增以下变量：
     - **VITE_ADMIN_PASSWORD**: 设置后台管理密码（必填）。
     - **VITE_GITHUB_TOKEN**: 您的 GitHub Personal Access Token （可选，用于预置同步凭证）。
     - **VITE_GITHUB_REPO**: 您的数据同步仓库名（可选，格式如 `username/repo`）。
5. **🚀 针对 Cloudflare 的深度优化 (推荐做)**:
   - **目的**: 避免每次保存书签同步数据时，触发重复的应用构建（部署）。
   - **操作**: 进入项目：**设置 -> 构建与部署 -> 关键路径 -> 构建监视路径 (Build watch paths)**。
   - **设置**: 在 **排除路径 (Excluded paths)** 中填入 `data/*` 并保存。

#### 2. 传统服务器私有化部署 (Nginx / Apache)
如果您有自己的服务器，只需执行以下命令：
```bash
npm run build
```
将生成的 `dist` 文件夹内的所有内容上传至 Web 服务器根目录即可。由于项目采用 `HashRouter`，您无需进行额外的 URL 重写设置，开箱即用。

---

## 📚 使用说明 (How to Use)

完成部署后，您可以按照以下流程开始使用：

1. **首次访问与登录**: 点击主页右上角的“齿轮”图标，使用您设置的 `VITE_ADMIN_PASSWORD` 完成认证。
2. **管理书签**: 在“管理标签”页面，您可以自由创建分类、添加站点。支持图标自动抓取、内外网双地址配置等进阶功能。
3. **备份与云端同步**: 
   - 勾选 **GitHub 同步**，填写您的 Personal Access Token (需勾选 `repo` 权限) 和仓库名（如 `username/repo`）。
   - **数据路径**: 系统会自动在 `main` 分支下的 `data/yunest_data.json` 中保存您的加密数据。
   - **初次拉取**: 新设备第一次进入时，如果您配置了仓库环境变量，系统会自动为您 Pull 云端数据。
4. **隐私保护提示**: 
   - **隐藏分组**: 敏感书签可以放入“隐藏”分类，仅在登录后可见。
   - **私有数据**: 如果您的代码仓库是公开的，建议在 Fork 时创建一个 **Private 仓库** 专门用于存储数据，实现真正的物理隔离。

---

## 🛡️ 数据安全与权限
- **Token 安全**: 同步时会自动剔除 GitHub Token 等敏感凭据，确保数据文件安全。
- **本地优先**: 遵循 Local First 原则，手动刷新不会丢失任何未同步的本地修改。

## 📄 许可申明 (License)

本项目基于 **MIT** License 开源。
