import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fetchDefaultData() {
  console.log('YuNest: 正在执行构建前数据同步...');

  // 1. 尝试从环境变量读取配置
  let token = process.env.VITE_GITHUB_TOKEN;
  let repo = process.env.VITE_GITHUB_REPO;

  // 2. 如果环境变量没有，尝试读取本地 .env 文件 (仅用于本地构建测试)
  if (!token || !repo) {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const tokenMatch = envContent.match(/VITE_GITHUB_TOKEN\s*=\s*(.*)/);
      const repoMatch = envContent.match(/VITE_GITHUB_REPO\s*=\s*(.*)/);
      if (tokenMatch) token = tokenMatch[1].trim().replace(/^["']|["']$/g, '');
      if (repoMatch) repo = repoMatch[1].trim().replace(/^["']|["']$/g, '');
    }
  }

  if (!token || !repo) {
    console.log('YuNest: 跳过构建时数据拉取 (未检测到 GitHub 配置参数)');
    return;
  }

  const dataPath = 'data/yunest_data.json';
  const url = `https://api.github.com/repos/${repo}/contents/${dataPath}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'YuNest-Build-Script'
      }
    });

    if (response.ok) {
      const json: any = await response.json();
      const content = Buffer.from(json.content, 'base64').toString('utf-8');
      
      // 验证 JSON 合法性
      const remoteData = JSON.parse(content);
      if (!remoteData.settings || !remoteData.categories) {
        throw new Error('拉取的数据格式不正确');
      }

      const targetPath = path.resolve(__dirname, '../public/data/default_data.json');
      
      // 确保目录存在
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.writeFileSync(targetPath, JSON.stringify(remoteData, null, 2));
      console.log(`YuNest: 成功从 GitHub (${repo}) 同步数据到构建资源中`);
    } else {
      console.warn(`YuNest: 拉取失败 (${response.status})，将使用项目现有的默认数据`);
    }
  } catch (error) {
    console.error('YuNest: 构建时数据同步出错:', error);
  }
}

fetchDefaultData();
