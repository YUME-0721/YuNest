<div align="center">
    <p>
        <a href="README.zh.md">简体中文</a> | English | <a href="https://navdocs.072199.xyz/">Official Site</a>
    </p>
    <p align="center">
    <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
    <img src="https://img.shields.io/badge/Cloudflare_Pages-F38020?style=for-the-badge&logo=cloudflare-pages&logoColor=white" alt="Cloudflare" />
  </p>
  <h1>YuNest - Personal Navigation Hub</h1>
  <p><strong><a href="https://nav.072199.xyz/">🚀 Click to Visit Demo Site</a></strong> (Password: <code>admin1234</code>)</p>
  <p>A modern, beautiful, and highly customizable personal static navigation and bookmark management tool.</p>
  <p>Since YuNest is a pure frontend static application, you can easily perform <a href="#-local-run--development">Local Deployment</a> or <a href="#-static-hosting-cloud-deployment">Static Hosting Cloud Deployment</a> (click to jump).</p>
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
- 💾 **Cross-Platform Edge Proxy Cloud Sync & Persistence**: 
  - **Zero Token Leak**: Uses Cloudflare Pages Functions / Vercel Edge / Tencent Cloud EdgeOne serverless proxy architecture. Store GitHub Tokens as server-side encrypted Secrets, **completely preventing tokens from leaking in frontend JS bundles or Network tabs**.
  - **Token-Free Across Devices**: Log in with your admin password on any device (phone, tablet, cybercafe PC) to push or pull data with one click.
  - **Local-First & Multi-Tier Fallback**: Stored in `localStorage` by default with JSON backup/restore support; automatically falls back to client-side direct sync on non-edge platforms (e.g. GitHub Pages).
- 🚀 **Performance Optimized**: 
  - **Zero-Latency Icons**: Icon solidification tech and CDN caching ensure instant rendering even on slow connections.
  - **Zero-Dependency Deployment**: Uses `HashRouter` for perfect compatibility with Cloudflare Pages, Vercel, and GitHub Pages without extra redirection config.

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Routing**: [React Router v7](https://reactrouter.com/) (HashRouter)
- **Edge Proxy**: [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/) / [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 📋 Prerequisites

Before starting the deployment, prepare the credentials required for GitHub synchronization (optional but highly recommended):

1. **Get GitHub Token**:
   - Visit GitHub [Settings -> Developer settings](https://github.com/settings/tokens).
   - Generate a new **Personal Access Token (classic)** or **Fine-grained Token**.
   - **Scopes**: Select **`repo`** for private repositories or **`public_repo`** for public repositories.
2. **Determine Sync Repo Name**:
   - Format is `YourUsername/RepoName`, e.g., `YUME-0721/YuNest`.
   - **Privacy Suggestion**: If you want your code to be public but your bookmark data private, create a separate **Private Repository** for data storage.

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
   - **`ADMIN_PASSWORD`**: Set your admin panel password (default `admin1234`).
   - **`GITHUB_TOKEN` / `GITHUB_REPO`**: Enter the credentials prepared above (the local dev server will automatically mount `/api/sync` proxy).
5. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   - Visit the output URL (usually `http://localhost:5173`).

---

### ☁️ Edge Cloud Deployment (Recommended)

**Most Recommended.** YuNest includes built-in edge proxy APIs. It runs permanently for free without requiring a dedicated server.

#### 1. Cloudflare Pages Deployment (Recommended)
1. **Fork this Repo**: Click **Fork** to copy the code to your GitHub account.
2. **Import Project**: Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/), go to **Workers & Pages** -> **Create application** -> **Pages** -> Connect GitHub repo.
3. **Build Config**:
   - **Framework preset**: `Vite` or `None`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Server-Side Secret Environment Variables (Crucial - Anti-Leak)**:
   - In project settings **Environment Variables**, only add the following 3 standard variables (check **Encrypt / Secret**):
     - **`ADMIN_PASSWORD`**: Admin panel password (default `admin1234`).
     - **`GITHUB_TOKEN`**: Your GitHub Token (encrypted on the server, invisible to frontend).
     - **`GITHUB_REPO`**: Your sync repo name (e.g. `YUME-0721/YuNest`).
5. **🚀 Cloudflare Optimization (Recommended)**:
   - Go to **Settings -> Build & deployment -> Build watch paths**.
   - In **Excluded paths**, add `data/*` and save. This prevents data sync from triggering redundant build tasks.

#### 2. Vercel Deployment
1. Import your forked GitHub repository.
2. In **Project Settings -> Environment Variables**, add `ADMIN_PASSWORD`, `GITHUB_TOKEN` (Sensitive), and `GITHUB_REPO`.
3. Click **Deploy**. Vercel will automatically recognize `api/sync.ts` and deploy it as a global Edge Function.

#### 3. Tencent Cloud EdgeOne Pages
1. Import repository and set output directory to `dist`.
2. Add `ADMIN_PASSWORD`, `GITHUB_TOKEN` (Encrypted), and `GITHUB_REPO` in Environment Variables.

---

## 🛡️ Security & Privacy
- **Edge Proxy Isolation**: Token is stored strictly in Cloudflare / Vercel / EdgeOne server-side memory. The browser only communicates with `/api/sync` via password authentication. Zero risk of token leak through F12 inspect or network sniffing.
- **Sensitive Field Sanitization**: Automatic stripping of local token fields when saving data to `data/yunest_data.json` on the `main` branch.
- **Local-First**: All data is preserved safely in the browser's `localStorage` even when offline.

## 📄 License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.

- **Free Software**: You are free to run, study, share, and modify the software.
- **Copyleft**: If you distribute modified versions of the project, they must be licensed under the same GPL-3.0 license.
- **Refer to the `LICENSE` file for the full text.**


