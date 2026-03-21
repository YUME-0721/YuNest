<div align="center">
    <p>
        <a href="README.zh.md">简体中文</a> | English
    </p>
    <p align="center">
    <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
    <img src="https://img.shields.io/badge/Cloudflare_Pages-F38020?style=for-the-badge&logo=cloudflare-pages&logoColor=white" alt="Cloudflare" />
  </p>
  <h1>YuNest - Personal Navigation Hub</h1>
  <p>A modern, beautiful, and highly customizable personal static navigation and bookmark management tool.</p>
  <p>Since YuNest is a pure frontend static application, you can easily run it locally or deploy it on any <a href="#☁️-static-hosting-cloud-deployment">Static Hosting Service</a> for free.</p>
</div>

![Home Screenshot](screenshots/homepage.png)

## ✨ Features

YuNest focuses on providing the most elegant "Start Page" experience. All content is stored locally in the browser, requiring no backend database.

- 🎨 **Premium Aesthetic Design**: Features Glassmorphism and Aurora lighting effects, with smooth entrance and hover micro-animations. Minimalist yet sophisticated.
- 🖼️ **Powerful Wallpaper Management**: 
  - Supports **Solid Colors** (fully customizable), **Static Images**, **Random Image APIs**, and **Local File Uploads**.
  - Toggle "Glassmorphism Blur" and "Dark Mask" for optimal visibility and contrast across different wallpapers.
- 🔍 **Multi-Engine Search Integration**: Built-in engine switching (Google, Bing, Baidu, etc.) with **Real-time Local Bookmark Search**: filter bookmarks as you type without pressing Enter.
- 🔖 **Flexible Bookmark Management**: 
  - **Diverse Layouts**: Switch between "Detailed Cards" (with descriptions and side icons) and "Compact Grid" (App drawer style) for each category.
  - Automatic Favicon grabbing or manual icon selection (Lucide Icon sets or Custom URLs).
  - **Dual Network Address Support**: Configure both "Default" and "Intranet" URLs. Toggle between them via the **Right-click Menu** on the homepage — perfect for HomeLab/NAS users.
- 🔐 **Privacy & Visibility Control**:
  - **Hidden Categories**: Set specific bookmark categories to "Hidden". These and their contents are completely invisible to guests and only appear dynamically after admin authentication.
- 🛡️ **Secure Admin Panel**: Built-in password-protected management interface. Customize the access password via environment variables.
- 💾 **Cloud Sync & Persistence**: 
  - Default storage in `localStorage`. Supports JSON backup/restore.
  - **GitHub API Integration**: Sync data to your repository's `data/yunest_data.json` (Recommended). Separate data updates from code deployments using Build Watch Paths.
- 🚀 **Performance Optimized**: 
  - **Zero-Latency Icons**: Icon solidification tech and CDN caching ensure instant rendering even on slow connections.
  - **Zero-Dependency Deployment**: Uses `HashRouter` for perfect compatibility with Cloudflare Pages, Vercel, and GitHub Pages without extra redirection config.

## 🛠️ Tech Stack

- **Framework**: [React 18](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Routing**: [React Router](https://reactrouter.com/) (HashRouter)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Deployment

YuNest provides an extremely simple deployment process.

### 💻 Local Run & Development

Suitable for users who want to customize the code further or run it in a private local network.

1. **Prerequisites**: Ensure you have [Node.js](https://nodejs.org/) (v18+ recommended) installed.
2. **Clone the Repo**:
   ```bash
   git clone https://github.com/YUME-0721/YuNest.git
   cd YuNest
   ```
3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Environment Config**:
   - Copy `.env.example` to `.env`.
   - **VITE_ADMIN_PASSWORD**: Set your admin panel password (required, default `123456`).
   - **VITE_GITHUB_TOKEN / REPO**: (Optional) Pre-set your credentials for cloud sync.
5. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   - Visit the output URL (usually `http://localhost:5173`).

---

### ☁️ Static Hosting Cloud Deployment

**Most Recommended.** YuNest can run permanently for free as a static site.

#### 1. Quick Deployment (Cloudflare Pages / Vercel)
1. **Fork this Repo**: Click **Fork** to copy the code to your GitHub account (Recommended to Fork as a **Private Repo** if you want to keep your bookmarks secret).
2. **Import Project**: Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) or Vercel and import your forked repo.
3. **Build Config**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   - Add `VITE_ADMIN_PASSWORD` in the platform's Environment Variables settings.
   - (Optional) Add `VITE_GITHUB_TOKEN` and `VITE_GITHUB_REPO`.
5. **🚀 Cloudflare Optimization (Recommended)**:
   - **Goal**: Prevent data sync from triggering redundant build tasks.
   - **Steps**: Go to **Settings -> Build & deployment -> Build watch paths**.
   - **Exclude**: Add `data/*` in **Excluded paths**.

#### 2. Manual Server Deployment (Nginx / Apache)
Run the build command:
```bash
npm run build
```
Upload the contents of the `dist` folder to your web server's root directory.

---

## 📚 Usage Instructions

1. **First Access**: Click the "Settings" icon in the top right and authenticate with your password.
2. **Manage Bookmarks**: Add categories and links. Customize icons and dual-network addresses.
3. **Cloud Sync**: 
   - Enable GitHub sync in the Backup section.
   - **Data Path**: Data is saved to `data/yunest_data.json` on the `main` branch.
   - **Auto Pull**: When visiting from a new device for the first time, YuNest will automatically pull data if repo env vars are set.
4. **Privacy**: 
   - Sensitive bookmarks can be placed in "Hidden" categories.
   - For public code repos, use a separate **Private Repo** for data storage to achieve physical isolation.

## 🛡️ Security
- **Token Masking**: Sensitive tokens are removed before syncing to ensure data files are safe.
- **Local First**: Manual refreshes won't overwrite unsynced local changes.

## 📄 License

This project is licensed under the **MIT** License.
