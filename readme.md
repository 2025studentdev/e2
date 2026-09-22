# e2 项目架构说明

## 概述

本仓库包含两个独立的静态站点生成器项目，通过 Cloudflare Pages 的 Git 集成能力统一构建，合并后发布为单一 Pages 站点。主站使用 Astro，博客使用 Hexo 并挂载于 `/blog` 子路径。自定义域名为 `e-2.top`。

## 目录结构

```
e2/
├── site/                    # Astro 主站
│   ├── src/
│   ├── public/
│   ├── astro.config.mjs
│   ├── package.json
│   └── package-lock.json
├── hexo-blog/               # Hexo 博客
│   ├── source/
│   ├── themes/              # 若通过 npm 安装主题，此目录通常为空
│   ├── _config.yml
│   ├── package.json
│   └── package-lock.json
└── build.sh                 # 合并构建脚本
```

## 技术栈

| 组件 | 技术 |
|------|------|
| 主站框架 | Astro |
| 主站 UI 集成 | React (`@astrojs/react`) |
| 主站 CSS | Tailwind CSS v4 (`@tailwindcss/vite`) |
| 博客框架 | Hexo |
| 博客主题 | 通过 npm 安装 |
| CI/CD | Cloudflare Pages（Git 集成） |
| 运行时 | Node.js 24（由 `package.json` 的 `engines` 指定） |
| 托管 | Cloudflare Pages |
| 自定义域名 | `e-2.top` |

## 构建与部署架构

### 触发条件

Cloudflare Pages 在以下情况自动触发构建：

- 推送到 Production 分支（如 `master`）
- 推送到其他分支或提交 PR 时触发 Preview 构建
- 在 Cloudflare Dashboard 中手动触发 Retry deployment

### 构建流程

Cloudflare Pages 在构建容器中执行 `build.sh`，流程如下：

1. 进入 `site/` 执行 `npm ci` 与 `npm run build`，输出至 `site/dist`
2. 进入 `hexo-blog/` 执行 `npm ci`，随后 `npx hexo clean && npx hexo generate`，输出至 `hexo-blog/public`
3. 清空 `outputdist/`，创建 `outputdist/blog/`
4. 将 `site/dist/*` 复制到 `outputdist/`
5. 将 `hexo-blog/public/*` 复制到 `outputdist/blog/`

合并后的 `outputdist` 目录结构：

```
outputdist/
├── index.html               # Astro 主站首页
├── assets/                  # Astro 静态资源
└── blog/                    # Hexo 博客
    ├── index.html
    ├── archives/
    └── ...
```

### 部署阶段

构建完成后，Cloudflare Pages 自动将 `outputdist` 发布为站点产物，无需额外的上传或发布步骤。Production 分支的构建结果发布到生产环境，其他分支发布到独立的 Preview URL。

## 关键配置

### 构建脚本 (`build.sh`)

```bash
#!/bin/bash
set -e

cd site
npm ci
npm run build
cd ..

cd hexo-blog
npm ci
npx hexo clean
npx hexo generate
cd ..

rm -rf outputdist
mkdir -p outputdist/blog
cp -r site/dist/* outputdist/
cp -r hexo-blog/public/* outputdist/blog/
```

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
- Hexo 的 `root` 只影响 HTML 中引用的 URL 前缀，不会在 `public/` 中生成 `blog/` 子目录

### Cloudflare Pages 项目设置

在 Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git 中配置：

| 配置项 | 值 |
|--------|-----|
| Production branch | `master` |
| Build command | `bash build.sh` |
| Build output directory | `outputdist` |
| Root directory | 留空 |

环境变量无需额外设置，Node 版本由 `package.json` 的 `engines` 字段声明。

### 自定义域名

在 Cloudflare Pages 项目的 **Custom domains** 中绑定 `e-2.top` 即可。由于域名托管在 Cloudflare，DNS 记录会自动配置，证书由 Cloudflare 自动签发与续期。

- 无需在构建产物中放置 `CNAME` 文件
- 无需配置 GitHub Pages 的 A 记录
- 无需 `.nojekyll` 文件（Cloudflare Pages 不经过 Jekyll 处理）

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

### 合并产物预览

在仓库根目录执行：

```bash
bash build.sh
npx serve outputdist
```

可提前验证 `/blog/` 子路径下的资源引用是否正确。

## 注意事项

- `site/` 与 `hexo-blog/` 的 `package-lock.json` 必须提交至仓库，否则 `npm ci` 将失败。
- Hexo 主题通过 npm 安装时，自定义主题配置文件（如 `_config.<theme>.yml`）需提交至仓库，否则 CI 构建将使用默认配置。
- Astro 主站不应生成 `/blog` 路由，否则与 Hexo 子路径冲突。
- `build.sh` 中使用了 `set -e`，任一构建步骤失败会立即中止，避免发布不完整的产物。
- Node 版本由 `package.json` 的 `engines` 字段指定为 24，Cloudflare Pages 构建容器会读取并应用。
- 若需限制构建触发路径，可在 Cloudflare Pages 项目的 Settings → Build → Build watch paths 中设置，例如仅在 `site/**` 或 `hexo-blog/**` 变更时触发。
- Cloudflare Pages 会自动缓存依赖，两个项目的 `node_modules` 分别缓存，无需额外配置。