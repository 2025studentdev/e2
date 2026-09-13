# e2 项目架构说明

## 概述

本仓库包含两个独立的静态站点生成器项目，通过 GitHub Actions 分别构建，合并后部署至 GitHub Pages。主站使用 Astro，博客使用 Hexo 并挂载于 `/blog` 子路径。自定义域名为 `e-2.top`。

## 目录结构

```
e2/
├── site/                    # Astro 主站
│   ├── src/
│   ├── public/
│   │   └── CNAME            # 自定义域名文件（可选）
│   ├── astro.config.mjs
│   ├── package.json
│   └── package-lock.json
├── hexo-blog/               # Hexo 博客
│   ├── source/
│   ├── themes/              # 若通过 npm 安装主题，此目录通常为空
│   ├── _config.yml
│   ├── package.json
│   └── package-lock.json
└── .github/
    └── workflows/
        └── deploy.yml       # 混合构建与部署工作流
```

## 技术栈

| 组件 | 技术 |
|------|------|
| 主站框架 | Astro |
| 主站 UI 集成 | React (`@astrojs/react`) |
| 主站 CSS | Tailwind CSS v4 (`@tailwindcss/vite`) |
| 博客框架 | Hexo |
| 博客主题 | 通过 npm 安装 |
| CI/CD | GitHub Actions |
| 运行时 | Node.js 24 |
| 托管 | GitHub Pages |
| 自定义域名 | `e-2.top` |

## 构建与部署架构

### 触发条件

工作流 `Deploy Astro + Hexo to Pages` 在以下情况触发：

- 推送到 `master` 分支
- 手动触发 (`workflow_dispatch`)

### 工作流作业

工作流包含三个作业：

1. **build-astro**：构建 Astro 主站
2. **build-hexo**：构建 Hexo 博客
3. **deploy**：合并产物并发布至 GitHub Pages

`deploy` 作业依赖前两个作业完成。

### 构建阶段

#### Astro 构建

- 检出仓库
- 配置 Node.js 24，启用 npm 缓存
- 在 `site/` 目录执行 `npm ci`
- 执行 `npm run build`，输出至 `site/dist`
- 上传构建产物为 artifact `astro-dist`

#### Hexo 构建

- 检出仓库
- 配置 Node.js 24，启用 npm 缓存
- 在 `hexo-blog/` 目录执行 `npm ci`
- 执行 `npx hexo clean && npx hexo generate`，输出至 `hexo-blog/public`
- 上传构建产物为 artifact `hexo-public`

### 合并阶段

`deploy` 作业下载两个 artifact：

- `astro-dist` 至 `site-dist`
- `hexo-public` 至 `hexo-public`

随后执行合并操作：

1. 创建 `site-dist/blog` 目录
2. 将 `hexo-public` 内容复制到 `site-dist/blog`
3. 删除 `site-dist/blog/CNAME`（若存在），避免覆盖主域
4. 写入 `site-dist/CNAME`，内容为 `e-2.top`
5. 创建 `site-dist/.nojekyll`，防止 GitHub Pages 的 Jekyll 处理以下划线开头的目录或文件

合并后的 `site-dist` 目录结构：

```
site-dist/
├── index.html               # Astro 主站首页
├── assets/                  # Astro 静态资源
├── blog/                    # Hexo 博客
│   ├── index.html
│   ├── archives/
│   └── ...
├── CNAME                    # e-2.top
└── .nojekyll
```

### 部署阶段

- 使用 `actions/upload-pages-artifact@v3` 上传合并后的 `site-dist` 为 Pages artifact
- 使用 `actions/deploy-pages@v4` 发布至 GitHub Pages

## 关键配置

### Astro 配置 (`site/astro.config.mjs`)

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://e-2.top',
  base: '/',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()]
  }
});
```

- `site` 用于生成绝对 URL（canonical、sitemap、RSS 等）
- `base` 设为主站根路径

### Hexo 配置 (`hexo-blog/_config.yml`)

```yaml
url: https://e-2.top
root: /blog/
```

- `url` 为站点完整 URL
- `root` 为子路径，必须以 `/` 结尾，否则生成的资源路径会错位

### GitHub Pages 设置

- Settings → Pages → Source 选择 **GitHub Actions**
- Custom domain 填写 `e-2.top`
- 启用 **Enforce HTTPS**

### DNS 记录

| 类型 | 主机记录 | 值 |
|------|----------|-----|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `e-2.top`（可选） |

若使用 Cloudflare 等 DNS 服务，所有记录需设为 **DNS only**（关闭代理），以便 GitHub 验证域名并签发证书。

## 本地开发

### Astro 主站

```bash
cd site
npm install
npm run dev
```

### Hexo 博客

```bash
cd hexo-blog
npm install
npx hexo server
```

本地预览时，Hexo 默认运行于 `http://localhost:4000/blog/`（由 `root` 配置决定）。

## 注意事项

- `site/` 与 `hexo-blog/` 的 `package-lock.json` 必须提交至仓库，否则 `npm ci` 将失败。
- Hexo 主题通过 npm 安装时，自定义主题配置文件（如 `_config.<theme>.yml`）需提交至仓库，否则 CI 构建将使用默认配置。
- Astro 主站不应生成 `/blog` 路由，否则与 Hexo 子路径冲突。
- 合并阶段写入的 `CNAME` 文件确保自定义域名在每次部署后保持有效。
- `.nojekyll` 文件用于禁用 GitHub Pages 默认的 Jekyll 构建，避免忽略 `_` 开头的目录。
- 工作流使用 `concurrency` 组 `pages`，确保同时仅有一个部署任务运行，新的推送会取消进行中的任务。