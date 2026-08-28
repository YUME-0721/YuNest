<div align="center">
    <p>
        简体中文 | <a href="README.md">English</a> | <a href="https://navdocs.072199.xyz/">文档官网</a>
    </p>
    <p align="center">
    <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
    <img src="https://img.shields.io/badge/Cloudflare_Pages-F38020?style=for-the-badge&logo=cloudflare-pages&logoColor=white" alt="Cloudflare" />
  </p>
  <h1>YuNest - 个人导航主页</h1>
  <p><strong><a href="https://nav.072199.xyz/">🚀 点击访问示例站点</a></strong>（认证密码：<code>admin1234</code>）</p>
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
- 💾 **多平台边缘代理云端同步与持久化支撑**: 
  - **安全零暴露 (Zero-Leak)**: 采用 Cloudflare Pages Functions / Vercel Edge / 腾讯云 EdgeOne 边缘代理架构，将 GitHub Token 作为服务端机密变量（Secrets）加密存储，**彻底杜绝前端 JS 源码与 Network 抓包泄露 Token**。
  - **跨设备免填 Token**: 任何设备（手机、平板、网吧等）输入管理密码登录后，即可直接一键双向推拉同步。
  - **本地优先与多重备份**: 默认存储于浏览器 `localStorage`，支持 JSON 文件导入导出；无边缘函数环境（如 GitHub Pages）自动降级为客户端手动配置模式。
- 🚀 **性能与体验优化**: 
  - **图标零延迟加载**: 采用自动图标固化技术与快速 CDN 缓存，确保即便在网络波动时也能瞬间呈现所有书签图标。
  - **零依赖一键部署**: 本身采用 `HashRouter` 设计完美适配静态托管平台，部署至 Cloudflare Pages、Vercel 及 GitHub Pages 时无需进行任何额外重定向配置。

## 🛠️ 技术栈 (Tech Stack)

- **框架**: [React 19](https://react.dev/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **构建工具**: [Vite 6](https://vitejs.dev/)
- **样式**: [Tailwind CSS v4](https://tailwindcss.com/)
- **路由**: [React Router v7](https://reactrouter.com/) (HashRouter)
- **边缘代理**: [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/) / [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)
- **图标集**: [Lucide React](https://lucide.dev/)

---

## 📋 准备工作 (Prerequisites)

在开始部署前，建议您先准备好 GitHub 自动同步所需的凭证（可选，但强烈建议）：

1. **获取 GitHub Token**:
   - 访问 GitHub [个人设置 -> 开发者设置](https://github.com/settings/tokens)。
   - 生成一个新的 **Personal Access Token (classic)** 或 **Fine-grained Token**。
   - **权限 (Scopes)**：如果是私有仓库请勾选 **`repo`**，如果是公开仓库勾选 **`public_repo`**。
2. **确定同步仓库名**:
   - 格式为 `您的用户名/仓库名`，例如 `YUME-0721/YuNest`。
   - **隐私建议**：如果您希望代码开源但书签数据私有，建议单独创建一个全新的 **Private (私有) 仓库** 用于存储数据。

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
   - **`ADMIN_PASSWORD`**: 设置您的管理认证密码（默认 `123456`）。
   - **`GITHUB_TOKEN` / `GITHUB_REPO`**: 填入上方准备好的 GitHub 凭证（本地开发服务器会自动挂载 `/api/sync` 模拟边缘代理）。
5. **启动开发服务**:
   ```bash
   npm run dev
   ```
   - 启动后访问控制台输出的 `http://localhost:5173` 即可。

---

### ☁️ 边缘云端部署 (Cloud Deployment - 推荐)

这是**最推荐**的部署方式。YuNest 随带边缘代理接口，无需额外购买服务器，永久免费运行。

#### 1. Cloudflare Pages 部署 (最推荐)
1. **Fork 本仓库**: 点击右上角的 **Fork**，将代码同步到您自己的 GitHub 账号下。
2. **导入项目**: 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，选择 **Workers & Pages** -> **Create application** -> **Pages** -> 连接 GitHub 仓库。
3. **配置构建指令**:
   - **构建预设 (Framework preset)**: `Vite` 或 `None`
   - **构建命令 (Build Command)**: `npm run build`
   - **输出目录 (Output Directory)**: `dist`
4. **设置服务端机密环境变量 (关键 - 彻底防泄露)**:
   - 在项目设置的 **Environment Variables** 中，添加以下变量（勾选 **Encrypt / Secret** 加密）：
     - **`GITHUB_TOKEN`**: 您的 GitHub 令牌（服务端加密，前端不可见）。
     - **`GITHUB_REPO`**: 您的同步仓库名（如 `YUME-0721/YuNest`）。
     - **`ADMIN_PASSWORD`**: 管理后台认证密码。
5. **🚀 针对 Cloudflare 的深度优化 (推荐)**:
   - 进入项目：**设置 -> 构建与部署 -> 关键路径 -> 构建监视路径 (Build watch paths)**。
   - 在 **排除路径 (Excluded paths)** 中填入 `data/*` 并保存。这样更新书签时不会触发重复无意义构建。

#### 2. Vercel 部署
1. 导入 Fork 的 GitHub 仓库。
2. 在 **Project Settings -> Environment Variables** 中添加 `GITHUB_TOKEN` (Sensitive)、`GITHUB_REPO` 和 `ADMIN_PASSWORD`。
3. 点击 **Deploy**，系统会自动识别 `api/sync.ts` 并部署为全球边缘函数。

#### 3. 腾讯云 EdgeOne Pages 部署
1. 导入仓库并在构建配置中选择输出目录为 `dist`。
2. 在环境变量中添加 `GITHUB_TOKEN`、`GITHUB_REPO` 和 `ADMIN_PASSWORD` 即可。

---

## 🛡️ 数据安全与权限设计
- **边缘代理隔离**: 令牌仅存储在 Cloudflare / Vercel / EdgeOne 边缘服务端内存中，浏览器仅通过密码鉴权与 `/api/sync` 通信，抓包和逆向 F12 源码绝无泄露风险。
- **敏感字段清洗**: 数据同步到 GitHub `main` 分支下的 `data/yunest_data.json` 时，会自动过滤掉任何本地 Token 字段。
- **本地优先 (Local-First)**: 即使离线或网络异常，所有数据依然安全保存在浏览器本地。

## 📄 开源协议

本项目基于 **GNU General Public License v3.0 (GPL-3.0)** 协议开源。

- **自由软件**：您可以自由地运行、研究、共享和修改本项目。
- **开源精神**：如果您分发修改后的版本，则必须在相同的 GPL-3.0 协议下发布。
- **详情请参阅项目根目录下的 `LICENSE` 文件。**


