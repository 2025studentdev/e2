---
title: 用 Astro 搭一个带侧边栏分组的文档站
order: 1
---

# 用 Astro 搭一个带侧边栏分组的文档站

Astro 的内容集合（Content Collections）天生适合做文档站：Markdown 文件放进目录，路由和侧边栏自动生成，几乎不用写胶水代码。这篇文章从零搭一个最小可用的文档站，支持 Tailwind 排版和按目录分组的侧边栏。

## 技术栈

- **Astro 5** — 静态站点生成，内容集合管理 Markdown
- **Tailwind CSS v4** — 样式，配 `@tailwindcss/typography` 让 Markdown 有排版
- **theSVG** — 侧边栏图标，直接内联 SVG 代码

## 项目结构

```
my-docs/
├── package.json
├── astro.config.mjs
└── src/
    ├── styles/
    │   └── global.css
    ├── content.config.ts
    ├── content/
    │   └── docs/
    │       ├── index.md
    │       ├── guides/
    │       │   └── routing.md
    │       └── reference/
    │           └── config.md
    ├── layouts/
    │   └── DocsLayout.astro
    └── pages/
        └── docs/
            ├── index.astro
            └── [...slug].astro
```

核心约定只有一条：**`src/content/docs/` 里的文件路径，直接决定 URL**。`guides/routing.md` 就是 `/docs/guides/routing`。

## 初始化

```bash
npm create astro@latest my-docs
cd my-docs
npm install tailwindcss @tailwindcss/vite @tailwindcss/typography
```

## 配置 Tailwind

`astro.config.mjs`：

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: { plugins: [tailwindcss()] },
});
```

`src/styles/global.css`：

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

注意 Tailwind v4 用 `@plugin` 加载插件，不是 v3 的 `require()`。

## 声明内容集合

`src/content.config.ts` 定义 `docs` 集合，并声明 frontmatter 的 schema：

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    order: z.number().default(999),
  }),
});

export const collections = { docs };
```

`title` 是侧边栏显示的文字，`order` 用来控制排序（默认 999，可以之后再加）。

## 写内容

`src/content/docs/index.md`：

```md
---
title: 首页
---

# 欢迎

这是文档首页。
```

`src/content/docs/guides/routing.md`：

```md
---
title: 路由
---

# 路由

文件路径即 URL。
```

## 路由

`src/pages/docs/index.astro` 渲染首页：

```astro
---
import { getEntry, render } from 'astro:content';
import DocsLayout from '../../layouts/DocsLayout.astro';

const entry = await getEntry('docs', 'index');
if (!entry) throw new Error('缺少 index.md');
const { Content } = await render(entry);
---
<DocsLayout title={entry.data.title}>
  <Content />
</DocsLayout>
```

`src/pages/docs/[...slug].astro` 处理其余所有页面：

```astro
---
import { getCollection, render } from 'astro:content';
import DocsLayout from '../../layouts/DocsLayout.astro';

export async function getStaticPaths() {
  const docs = await getCollection('docs');
  return docs
    .filter((entry) => entry.id !== 'index')
    .map((entry) => ({
      params: { slug: entry.id },
      props: { entry },
    }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---
<DocsLayout title={entry.data.title}>
  <h1>{entry.data.title}</h1>
  <Content />
</DocsLayout>
```

`entry.id` 包含目录前缀（如 `guides/routing`），所以子目录自动生效，不用改任何代码。

## 布局：侧边栏按目录分组

`src/layouts/DocsLayout.astro` 里把集合按第一段路径分组，渲染成带小标题的侧边栏：

```astro
---
import '../styles/global.css';
import { getCollection } from 'astro:content';

const docs = await getCollection('docs');

// 按第一段路径分组
const groups: Record<string, typeof docs> = {};
for (const entry of docs) {
  if (entry.id === 'index') continue;
  const [head, ...rest] = entry.id.split('/');
  const key = rest.length ? head : '其他';
  (groups[key] ||= []).push(entry);
}

const groupLabels: Record<string, string> = {
  guides: '指南',
  reference: '参考',
};

const currentPath = Astro.url.pathname.replace(/\/$/, '') || '/';
const { title } = Astro.props;
---
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
  </head>
  <body class="min-h-screen bg-white text-slate-800 antialiased">
    <div class="mx-auto flex max-w-6xl gap-10 px-6 py-10">

      <aside class="w-56 shrink-0">
        <a href="/docs" class="mb-6 flex items-center gap-2 text-slate-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span class="font-semibold">My Docs</span>
        </a>

        <a href="/docs"
           class:list={[
             'mb-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm transition',
             currentPath === '/docs'
               ? 'bg-slate-900 text-white'
               : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
           ]}>
          首页
        </a>

        {Object.entries(groups).map(([name, items]) => (
          <div class="mb-4">
            <div class="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {groupLabels[name] ?? name}
            </div>
            <div class="space-y-1">
              {items.map((entry) => {
                const href = `/docs/${entry.id}`;
                const active = currentPath === href;
                return (
                  <a href={href}
                     class:list={[
                       'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition',
                       active
                         ? 'bg-slate-900 text-white'
                         : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                     ]}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    {entry.data.title}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </aside>

      <main class="min-w-0 flex-1">
        <article class="prose prose-slate max-w-none prose-headings:scroll-mt-20">
          <slot />
        </article>
      </main>

    </div>
  </body>
</html>
```

`prose` 类来自 typography 插件，负责 Markdown 里 `h1/h2/code/ul` 的排版。

## 新增文章

加一篇文章 = 加一个 `.md` 文件。比如新建 `src/content/docs/guides/deployment.md`：

```md
---
title: 部署
order: 2
---

# 部署

```bash
npm run build
```
```

保存后侧边栏的「指南」组下自动出现「部署」，URL 是 `/docs/guides/deployment`。

## 自定义分组名

侧边栏的小标题取自目录名。想显示中文，在 `DocsLayout` 的 `groupLabels` 里加映射：

```ts
const groupLabels: Record<string, string> = {
  guides: '指南',
  reference: '参考',
};
```

没有映射的目录就用原名兜底。

## 小结

这套结构的关键只有三点：

1. **内容即路由** — `src/content/docs/` 的路径决定 URL，新增文件无需注册。
2. **集合即数据源** — `getCollection('docs')` 拿到所有条目，侧边栏从它推导。
3. **布局即外壳** — 侧边栏、分组、高亮都在 `DocsLayout` 里，页面只负责渲染 `<Content />`。

剩下的目录（TableOfContents）、上一页/下一页、搜索，都可以在这个骨架上逐步加。