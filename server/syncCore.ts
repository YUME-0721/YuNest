/**
 * 跨平台边缘函数核心通用逻辑 (Cloudflare Pages / Vercel / 腾讯云 EdgeOne / 本地开发)
 * 职责：代理读写 GitHub 仓库的 data/yunest_data.json，保护服务端加密 Token 不外泄到前端
 */

export interface SyncEnv {
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  ADMIN_PASSWORD?: string;
}

export async function handleSyncRequest(req: Request, env: SyncEnv): Promise<Response> {
  // 处理跨域预检
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auth-password',
      },
    });
  }

  const token = env.GITHUB_TOKEN;
  const repo = env.GITHUB_REPO;
  const expectedPassword = env.ADMIN_PASSWORD || 'admin1234';

  // 1. 检查服务端变量配置状态
  if (!token || !repo) {
    return new Response(
      JSON.stringify({
        code: 'NOT_CONFIGURED',
        error: '服务端未配置 GITHUB_TOKEN 或 GITHUB_REPO 密钥变量',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 2. 安全鉴权：校验请求携带的管理密码
  const clientAuth = req.headers.get('x-auth-password') || req.headers.get('authorization')?.replace('Bearer ', '');
  if (clientAuth !== expectedPassword) {
    return new Response(
      JSON.stringify({
        code: 'UNAUTHORIZED',
        error: '认证失败：管理员口令不正确',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const path = 'data/yunest_data.json';
  const oldPath = 'yunest_data.json';
  const branch = 'main';
  const githubApiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;

  // 3. GET 请求：从 GitHub 仓库代理拉取配置数据
  if (req.method === 'GET') {
    try {
      let res = await fetch(`${githubApiUrl}?ref=${branch}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'YuNest-Sync-Proxy',
        },
      });

      // 兼容 master 分支
      if (!res.ok && res.status === 404) {
        res = await fetch(`${githubApiUrl}?ref=master`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'YuNest-Sync-Proxy',
          },
        });
      }

      // 兼容旧版根目录
      if (!res.ok && res.status === 404) {
        res = await fetch(`https://api.github.com/repos/${repo}/contents/${oldPath}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'YuNest-Sync-Proxy',
          },
        });
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        return new Response(
          JSON.stringify({ code: 'GITHUB_ERROR', error: `GitHub 拉取失败 (${res.status}): ${errText}` }),
          { status: res.status, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const data: any = await res.json();
      const content = decodeURIComponent(escape(atob(data.content)));
      return new Response(content, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    } catch (e: any) {
      return new Response(
        JSON.stringify({ code: 'SERVER_ERROR', error: e.message || '拉取数据时服务端发生异常' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // 4. POST 请求：将本地配置数据推送到 GitHub 仓库
  if (req.method === 'POST') {
    try {
      const payload = await req.json();

      // 4.1 尝试获取现有文件的 sha (如果文件已存在)
      let sha = '';
      let targetBranch = branch;
      let getRes = await fetch(`${githubApiUrl}?ref=${branch}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'YuNest-Sync-Proxy',
        },
      });

      if (!getRes.ok && getRes.status === 404) {
        // 尝试 master
        getRes = await fetch(`${githubApiUrl}?ref=master`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'YuNest-Sync-Proxy',
          },
        });
        if (getRes.ok) targetBranch = 'master';
      }

      if (getRes.ok) {
        const existing: any = await getRes.json();
        sha = existing.sha;
      }

      // 4.2 清洗可能意外包含的本地 Token 字段
      const stateToSave = {
        ...payload,
        settings: {
          ...(payload.settings || {}),
          githubToken: '',
          githubRepo: repo, // 记录同步仓库名
        },
      };

      // 4.3 写入 GitHub 仓库
      const putRes = await fetch(githubApiUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json',
          'User-Agent': 'YuNest-Sync-Proxy',
        },
        body: JSON.stringify({
          message: `YuNest Data Sync (${new Date().toISOString()})`,
          content: btoa(unescape(encodeURIComponent(JSON.stringify(stateToSave, null, 2)))),
          sha: sha || undefined,
          branch: targetBranch,
        }),
      });

      if (!putRes.ok) {
        const err: any = await putRes.json().catch(() => ({}));
        return new Response(
          JSON.stringify({ code: 'GITHUB_PUSH_ERROR', error: err.message || '推送到 GitHub 仓库失败' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({ success: true, timestamp: Date.now() }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      return new Response(
        JSON.stringify({ code: 'SERVER_ERROR', error: e.message || '推送数据时服务端发生异常' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
}
