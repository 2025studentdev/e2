---
title: 把 Sitemap 收窄到 /blog：一次必要的配置拆分
pubDate: 2026-10-24T16:00:00
description: 全站 sitemap 看起来省事，实际是把游戏页、工具页一股脑塞给搜索引擎。记录一次把 sitemap 配置抽离到独立文件、只放行 /blog 的改动，以及为什么必须这么做。
tags:
- Astro
- SEO
- Sitemap
---

默认情况下，`@astrojs/sitemap` 会把构建产物里的**每一个页面**都写进 sitemap。打开 `dist/sitemap-0.xml`，你能看到 `/docs/*`、`/games/play/*`、`/status`、`/about` 全都赫然在列。省事是真省事，但它默认了一个前提：站点上所有页面都是"希望被搜索引擎收录的内容页"。对一个博客来说，这个前提并不成立。

## 全量 sitemap 的问题在哪

sitemap 的本质是**给爬虫的一份优先级声明**，不是文件清单。它回答的问题是："这个站点上哪些 URL 值得你花时间去抓、去收录。"

问题就出在这：

- **主题稀释**。搜索引擎会根据站点收录页面的分布判断主题。一个内容站如果 sitemap 里一半是游戏、工具、状态页，主题信号就被拉散了。
- **抓取预算浪费**。爬虫对单个站点的抓取是有配额和节奏的。几十个 `/games/play/*` 页面挤在 sitemap 里，会占掉本该分给文章的抓取机会。
- **收录质量下降**。那些页面本来就不需要被搜索到——用户不会在 Google 上搜"2048 小游戏"然后点进你的站点。被收录了也只是噪音，甚至可能因为内容单薄影响整体评价。

换句话说，**sitemap 应该反映"内容"，而不是"文件系统里有什么"**。这两件事在静态站点里恰好长得一样，所以很容易混为一谈。

## 只保留 /blog

目标很明确：sitemap 里只留下 `/blog` 本身和它下面的所有文章路由。

`@astrojs/sitemap` 提供了 `filter` 选项，传入一个返回布尔值的函数即可。参数是完整的 URL 字符串，所以判断前要先取出 `pathname`：

```ts
import type { SitemapOptions } from '@astrojs/sitemap';

export const sitemapConfig: SitemapOptions = {
  filter: (page) => {
    const { pathname } = new URL(page);
    return pathname === '/blog' || pathname.startsWith('/blog/');
  },
};
```

两个条件缺一不可：`pathname === '/blog'` 放行博客首页（它没有尾斜杠），`startsWith('/blog/')` 放行所有文章和分页。

## 为什么要拆到独立文件

这段逻辑完全可以内联在 `astro.config.mjs` 里：

```js
sitemap({
  filter: (page) => { /* ... */ },
})
```

能跑，但有两个理由值得把它挪出去：

1. **`astro.config.mjs` 已经够长了**。它同时管着 integrations、vite、markdown processor、Shiki 主题、一堆 remark/rehype 插件，还内联了一个 `remarkContainers`。再往里塞 sitemap 规则，下次改的时候得在一堆无关配置里翻。
2. **它是会生长的**。今天是"只留 `/blog`"，明天可能就是"排除 `/blog/page/*` 分页"、"给某些标签页加 `changefreq`"。这些规则属于 sitemap 自己的领域，不该和构建配置混在一起。

拆分后就是两个文件：

**`src/config/sitemap-setting.ts`**

```ts
import type { SitemapOptions } from '@astrojs/sitemap';

/**
 * Sitemap 配置：仅收录 /blog 及以下文章路由，其余页面一律排除。
 */
export const sitemapConfig: SitemapOptions = {
  filter: (page) => {
    const { pathname } = new URL(page);
    return pathname === '/blog' || pathname.startsWith('/blog/');
  },
};
```

**`astro.config.mjs`** 只加一条 import、改一个调用：

```js
import { sitemapConfig } from './src/config/sitemap-setting.ts';

// ...

integrations: [react(), sitemap(sitemapConfig), svelte()],
```

`filter` 只影响 sitemap 文件内容，**不影响 Astro 构建哪些页面**。`/games`、`/docs` 照样生成 HTML，只是不进 sitemap。这一点容易搞混——构建日志里依然会打印全部 50 个页面，那是页面生成，跟 sitemap 无关。

## 验证

改完跑一次 `npm run build`，确认日志里有：

```
[@astrojs/sitemap] `sitemap-index.xml` created at `dist`
```

然后直接看产物，这是唯一可靠的验证方式：

```powershell
Select-String -Path dist\sitemap-0.xml -Pattern '<loc>' | ForEach-Object { $_.Line.Trim() }
```

如果输出全是 `https://e-2.top/blog...`，就说明收窄成功。剩下任何一个 `/docs`、`/games` 都是漏网之鱼。

## 一个已知的边界

当前规则会把 `/blog/page/2/` 这类分页页也收录进去，因为它是 `startsWith('/blog/')`。分页列表算不算"文章路由"，取决于你怎么看——保留它能让爬虫顺着翻页找到较早的文章，但也会让 sitemap 里混入非正文页面。

如果哪天决定排除分页，改一行就行，因为规则已经独立成文件了：

```ts
return (
  pathname === '/blog' ||
  (pathname.startsWith('/blog/') && !pathname.startsWith('/blog/page/'))
);
```

这就是拆出去的收益——**要改的地方明确、要动的范围最小**，而不是每次都在主配置里大海捞针。