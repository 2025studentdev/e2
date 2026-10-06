---
title: 怎么使用 Cloudflare Pages 部署你的网站？
pubDate: 2026-10-06T14:00:00
description: 从零开始，一步步教你使用 Cloudflare Pages 部署静态网站或前端应用，涵盖 Git 集成、自定义域名、环境变量等核心操作。
tags:
  - Cloudflare
  - Pages
  - 部署
  - 教程
---

Cloudflare Pages 是一个面向前端开发者的静态网站托管平台，可以直接从 Git 仓库自动构建和部署你的网站，并免费提供全球 CDN 加速、预览部署和自定义域名支持。下面是从零开始的完整使用指南。

##  准备工作

开始之前，你需要确保：

- 拥有一个 **Cloudflare 账号**（免费注册即可）。
- 有一个 **GitHub 或 GitLab 仓库**，里面存放了你的网站源码。Cloudflare Pages 目前支持 GitHub 和 GitLab 的公有仓库和私有仓库。
- 了解基本的 **Git 操作**（clone、commit、push）。

如果你的网站还没有仓库，可以先在 GitHub 上创建一个新仓库，然后把本地代码推上去。

##  第一步：通过 Git 集成创建 Pages 项目

这是最推荐的部署方式，配置完成后每次推送到指定分支都会自动触发构建和部署。

1. 登录 Cloudflare Dashboard，在左侧菜单中点击 **Workers & Pages**，然后点击 **Create application**。
2. 选择 **Pages** 标签页，点击 **Connect to Git**。
3. 授权 Cloudflare 访问你的 GitHub 或 GitLab 账号，然后从列表中选择你要部署的仓库。
4. 点击 **Begin setup** 进入构建配置页面。

##  第二步：配置构建与部署设置

在 **Set up builds and deployments** 页面，你需要填写以下信息：

| 配置项 | 说明 |
|---|---|
| **Project name** | 项目名称，会用于生成 `*.pages.dev` 子域名，默认与 Git 项目名一致 |
| **Production branch** | 生产分支，通常是 `main` 或 `master`，推送到此分支会触发生产部署 |
| **Build command** | 构建命令，根据你使用的框架填写（如 `npm run build`、`npx gatsby build`） |
| **Build output directory** | 构建输出目录，即构建命令生成的静态文件所在目录（如 `dist`、`public`、`out`） |

如果你不使用任何框架或静态网站生成器，**构建命令留空即可**，或者填写 `exit 0` 以启用 Pages Functions 等高级功能。构建输出目录则填写你存放 `index.html` 等静态文件的目录。

Cloudflare 为流行的框架提供了预设配置，例如：

| 框架 | 构建命令 | 输出目录 |
|---|---|---|
| React (Vite) | `npm run build` | `dist` |
| Gatsby | `npx gatsby build` | `public` |
| Next.js (Static Export) | `npx next build` | `out` |
| Hugo | `hugo` | `public` |
| Jekyll | `jekyll build` | `_site` |
| Astro | `npm run build` | `dist` |
| Vue | `npm run build` | `dist` |

完整列表可参考 Cloudflare 官方文档的构建配置页面。如果找不到你的框架，可以查阅框架文档来确定正确的构建命令和输出目录。

填写完成后点击 **Save and Deploy**，Cloudflare 就会开始第一次构建和部署。完成后你会获得一个 `*.pages.dev` 的预览地址，可以直接访问你的网站。

##  第三步：绑定自定义域名

部署成功后，你可以把自定义域名绑定到 Pages 项目上。

1. 在 Cloudflare Dashboard 中进入你的 Pages 项目，点击 **Custom domains** 标签页。
2. 点击 **Set up a domain**，输入你想使用的域名（如 `blog.example.com` 或 `example.com`），然后点击 **Continue**。

**情况一：使用子域名（如 `blog.example.com`）**

如果你的域名不托管在 Cloudflare 上，你需要在 DNS 服务商处添加一条 **CNAME 记录**，指向你的 `<项目名>.pages.dev` 地址：

| 记录类型 | 主机记录 | 记录值 |
|---|---|---|
| CNAME | `blog` | `<你的项目名>.pages.dev` |

如果你的域名**已经托管在 Cloudflare**（即使用了 Cloudflare 的 Nameserver），CNAME 记录会在你确认后自动添加，无需手动操作。

**情况二：使用根域名（如 `example.com`）**

根域名（Apex 域名）必须将域名的 Nameserver 指向 Cloudflare，然后 Cloudflare 会自动为你创建 CNAME 记录。如果你的域名不在 Cloudflare 上管理，建议使用子域名方式，或者先将域名的 DNS 迁移到 Cloudflare。

##  替代方案：直接上传部署

如果你不想把代码放在 Git 仓库中，或者你的构建过程需要在本地或 CI 中完成，可以使用 **Direct Upload** 方式。

安装 Wrangler CLI 后，在本地构建好网站，然后运行：

```bash
npx wrangler pages deploy <输出目录> --project-name=<项目名>
```

例如，如果你的构建输出目录是 `dist`，项目名为 `my-site`：

```bash
npx wrangler pages deploy dist --project-name=my-site
```

首次部署时 Wrangler 会自动创建 Pages 项目。你也可以指定 `--branch` 参数来创建预览部署。

##  第四步：配置环境变量

如果你的项目在构建时需要环境变量（如 API 密钥、Node.js 版本等），可以在 Pages 项目的 **Settings → Environment variables** 中添加。

Cloudflare Pages 默认会注入一些系统环境变量，例如 `CI=true`、`CF_PAGES=1`、`CF_PAGES_COMMIT_SHA` 等，你可以在构建脚本中直接使用。

一个常见的配置是固定 Node.js 版本，避免因默认版本变更导致构建失败：

| 变量名 | 值 |
|---|---|
| `NODE_VERSION` | `22` |

你可以在 Production 和 Preview 环境中分别配置不同的变量值。

##  第五步：预览部署与分支管理

每当你向**非生产分支**推送代码时，Cloudflare Pages 会自动创建一个 **Preview Deployment**，生成一个唯一的预览 URL，方便你在合并到生产分支之前查看效果。

当你在 GitHub 或 GitLab 上创建 Pull Request 时，Pages 也会自动在 PR 中生成预览链接，团队成员可以直接点击查看改动效果。

你可以在 **Settings → Builds → Branch control** 中配置哪些分支自动部署预览，或将预览分支设为 **None** 来完全禁用自动预览部署。

## ⚡ 进阶功能：Pages Functions

Pages Functions 允许你在 Pages 项目中添加服务端逻辑，例如 API 端点、表单处理、身份验证等。它基于 Cloudflare Workers 运行，在边缘节点执行，延迟极低。

要使用 Pages Functions，只需在项目根目录创建一个 `functions` 目录，在其中编写 JavaScript 或 TypeScript 文件即可。例如，创建 `functions/api/hello.js`：

```js
export async function onRequest(context) {
  return new Response(JSON.stringify({ message: "Hello from Pages Functions!" }), {
    headers: { "Content-Type": "application/json" },
  });
}
```

部署后，访问 `/api/hello` 就会调用这个函数。

需要注意的是，纯静态项目的请求是**完全免费且无限**的。但一旦添加了 Functions，所有请求默认都会触发函数调用，从而计入 Workers 的请求额度。如果你希望静态资源仍然享受无限免费请求，可以创建一个 `_routes.json` 文件来排除静态路由。

##  构建缓存优化

对于依赖较多的项目，构建时间可能较长。Cloudflare Pages 提供了**构建缓存**功能，可以缓存依赖安装结果和构建输出，显著加快后续构建速度。

在 Pages 项目的 **Settings → Build → Build cache** 中点击 **Enable** 即可开启。每个项目有 10 GB 的缓存空间。

##  常见问题排错

- **构建失败**：首先检查构建命令和输出目录是否正确。可以查看部署日志中的完整错误信息。如果 Node.js 版本不兼容，尝试添加 `NODE_VERSION` 环境变量。
- **访问 `*.pages.dev` 出现 404**：确保项目根目录下存在 `index.html` 文件，这是 Pages 在访问根路径时默认返回的文件。
- **自定义域名不生效**：检查 DNS 记录是否正确配置，CNAME 的目标是否为 `<项目名>.pages.dev`。DNS 更改可能需要几分钟到几小时才能全球生效。如果域名已托管在 Cloudflare，确认记录已自动添加。
- **构建时间过长**：开启构建缓存，并检查是否安装了不必要的依赖。对于 monorepo 项目，可以在构建配置中指定 Root directory 来缩小构建范围。

##  补充说明

值得注意的是，Cloudflare 目前**推荐新项目使用 Cloudflare Workers** 来替代 Pages 进行部署，Workers 同样支持静态资源托管，并且能使用最新的平台能力。不过，Pages 的 Git 集成工作流更加开箱即用，对于纯静态网站和简单的前端应用来说，Pages 仍然是更便捷的选择。你可以根据项目需求自行权衡。

完成以上步骤后，你的网站就已经通过 Cloudflare Pages 部署上线，并可以通过自定义域名访问了。之后每次向生产分支推送代码，Cloudflare 都会自动重新构建和部署，整个过程无需手动干预。