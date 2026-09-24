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


# 我是如何为 Astro 文档站点做移动端适配的

## 背景

这个文档站点原本只有一套桌面端布局：左侧固定 `w-56` 的侧边栏，右侧正文 `flex-1`。在宽屏上阅读体验不错，但一到移动端竖屏就出问题——侧边栏硬生生占掉 224px，正文区域被挤得每行只剩两三个字，几乎没法读。

需求很明确：**移动端要能舒服地看正文，侧边栏不能一直占着横向空间；桌面端保持原样；路由、内容集合、分组逻辑都不动。**

这篇文章记录我具体的适配思路和实现细节。

## 方案选择：为什么用抽屉，而不是折叠面板

移动端侧边栏常见的处理方式有三种：

1. **顶部折叠面板**：侧边栏内容折叠到正文上方，点开向下展开。
2. **底部标签栏**：把主要导航放到底部，类似 App。
3. **抽屉 + 汉堡按钮**：侧边栏默认隐藏在屏幕外，点汉堡从左侧滑出。

我选了第三种。原因：

- 文档站点的侧边栏本质是**导航目录**，不是高频操作，不需要一直可见。
- 抽屉能完整保留桌面端侧边栏的所有结构和分组，改动最小。
- 汉堡按钮 + 抽屉是移动端非常成熟的交互模式，用户不需要学习。
- 折叠面板会把正文往下推，每次打开都要滚动，反而更烦。

断点直接用 Tailwind 默认的 `md`（768px）。小于 768px 走移动端抽屉，大于等于 768px 恢复桌面端常驻侧边栏。

## 整体结构

移动端适配后的 `DocsLayout.astro` 结构大致如下：

```astro
<body>
  <!-- 移动端顶栏：汉堡 + 当前标题 -->
  <header class="sticky top-0 ... md:hidden">...</header>

  <!-- 遮罩 -->
  <div id="menu-overlay" class="fixed inset-0 ... hidden md:hidden"></div>

  <div class="mx-auto max-w-6xl md:flex md:gap-10 md:px-6 md:py-10">
    <!-- 侧边栏：桌面常驻，移动端抽屉 -->
    <aside id="sidebar" class="fixed ... -translate-x-full md:static md:translate-x-0 md:w-56">
      ...
    </aside>

    <!-- 正文 -->
    <main class="min-w-0 flex-1 px-4 py-6 md:px-0 md:py-0">
      <article class="prose prose-slate max-w-none break-words ...">
        <slot />
      </article>
    </main>
  </div>

  <script>/* 抽屉开关逻辑 */</script>
</body>
```

关键点：

- 外层容器在移动端是普通块级布局，桌面端才变成 `md:flex`。
- 侧边栏在移动端是 `fixed` 定位，默认 `-translate-x-full` 移出屏幕；桌面端用 `md:static md:translate-x-0` 复位。
- 正文容器加了 `min-w-0`，防止 flex 子项被内容撑破。

## 移动端顶栏

移动端需要两个东西：一个打开侧边栏的入口，一个当前页面标题，让用户知道自己在哪。

```astro
<header class="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
  <button id="menu-open" type="button" aria-label="打开菜单" aria-controls="sidebar" aria-expanded="false"
    class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100">
    <!-- 汉堡图标 -->
  </button>
  <a href="/docs" class="truncate font-semibold text-slate-900">{title}</a>
</header>
```

细节：

- `sticky top-0` + `backdrop-blur`，滚动时保持可操作，又不完全遮挡内容。
- `md:hidden` 保证桌面端不出现。
- 标题用 `truncate`，长标题不会撑破布局。
- 按钮带 `aria-label`、`aria-controls`、`aria-expanded`，兼顾无障碍。

## 抽屉侧边栏

侧边栏复用原来的内容，只改外层容器和少量样式：

```astro
<aside id="sidebar"
  class="fixed inset-y-0 left-0 z-50 w-72 -translate-x-full overflow-y-auto border-r border-slate-200 bg-white p-4 transition-transform duration-200 ease-out
         md:static md:z-auto md:w-56 md:shrink-0 md:translate-x-0 md:overflow-visible md:border-r-0 md:bg-transparent md:p-0">
  ...
</aside>
```

移动端：

- `fixed inset-y-0 left-0`：贴左侧全高。
- `w-72`（288px）：比桌面端宽一点，因为移动端没有并排的正文，宽一点更好点。
- `-translate-x-full`：默认移出屏幕。
- `overflow-y-auto`：内容多时可滚动。
- `transition-transform duration-200`：滑入滑出动画。
- `z-50`：在遮罩之上。

桌面端（`md:` 前缀）：

- `md:static`：回到文档流。
- `md:w-56 md:shrink-0`：恢复原来的固定宽度。
- `md:translate-x-0`：位置复位。
- `md:overflow-visible`：桌面端不需要内部滚动。
- `md:border-r-0 md:bg-transparent md:p-0`：去掉移动端为了抽屉加的边框、背景和内边距，保持桌面端原样。

侧边栏顶部加了一个关闭按钮，只在移动端显示：

```astro
<button id="menu-close" type="button" aria-label="关闭菜单"
  class="... md:hidden">
  <!-- X 图标 -->
</button>
```

## 遮罩层

抽屉打开时，需要一个遮罩让用户知道背景不可点，同时点击遮罩可以关闭。

```astro
<div id="menu-overlay" class="fixed inset-0 z-40 hidden bg-slate-900/50 md:hidden" aria-hidden="true"></div>
```

- `fixed inset-0` 铺满屏幕。
- `z-40` 在侧边栏 `z-50` 之下。
- 默认 `hidden`，打开时移除。
- `md:hidden` 保证桌面端永远不会出现。

## 交互脚本

Astro 的 `<script>` 默认会被打包并执行一次，适合放这种小交互：

```js
const openBtn = document.getElementById('menu-open');
const closeBtn = document.getElementById('menu-close');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('menu-overlay');

const open = () => {
  sidebar?.classList.remove('-translate-x-full');
  overlay?.classList.remove('hidden');
  openBtn?.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
};

const close = () => {
  sidebar?.classList.add('-translate-x-full');
  overlay?.classList.add('hidden');
  openBtn?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
};

openBtn?.addEventListener('click', open);
closeBtn?.addEventListener('click', close);
overlay?.addEventListener('click', close);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') close();
});

// 点击侧边栏内链接后自动关闭
sidebar?.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));

// 从移动端切回桌面端时复位状态
const mq = window.matchMedia('(min-width: 768px)');
const onMq = (e) => { if (e.matches) close(); };
mq.addEventListener('change', onMq);
```

几个容易忽略的点：

1. **锁 body 滚动**：抽屉打开时 `document.body.style.overflow = 'hidden'`，防止背景跟着滑。关闭时复位。
2. **点击链接自动关闭**：移动端用户点完导航，抽屉应该收起来，否则会挡住新页面。
3. **Esc 关闭**：桌面端用户习惯，移动端外接键盘也适用。
4. **断点变化时复位**：如果用户从窄屏旋转到宽屏，或者拖拽窗口，`matchMedia` 监听 `(min-width: 768px)`，一旦进入桌面端就强制关闭抽屉，避免状态错乱。
5. **`?.` 可选链**：防止某个元素不存在时脚本报错。

## 正文排版优化

移动端正文容器：

```astro
<main class="min-w-0 flex-1 px-4 py-6 md:px-0 md:py-0">
  <article class="prose prose-slate max-w-none break-words prose-headings:scroll-mt-20">
    <slot />
  </article>
</main>
```

改动：

- `min-w-0`：flex 子项默认 `min-width: auto`，长内容会撑破容器，加上这个才能正常收缩。
- 移动端 `px-4 py-6`：左右留一点边距，上下留呼吸空间。
- 桌面端 `md:px-0 md:py-0`：外层容器已经有 `md:px-6 md:py-10`，不需要重复。
- `break-words`：防止长链接、长英文单词撑破布局。
- `prose` 和 `prose-slate` 保持不变，继续用 `@tailwindcss/typography` 的排版能力。

## “其他”分组放到最后

原来的分组逻辑直接用 `Object.entries(groups)` 渲染，顺序取决于对象键的插入顺序，不稳定。我加了一步排序：

```js
const orderedGroups = Object.entries(groups).filter(([name]) => name !== '其他');
if (groups['其他']) orderedGroups.push(['其他', groups['其他']]);
```

这样：

- 非「其他」分组保持原来的插入顺序。
- 「其他」永远排在最后。
- 渲染时用 `orderedGroups` 替代 `groups`。

## 没有改动的部分

为了控制影响范围，以下内容全部保持原样：

- `src/pages/docs/index.astro`
- `src/pages/docs/[...slug].astro`
- `src/content.config.ts`
- `src/styles/global.css`
- 路由规则、`entry.id` 的使用方式
- 侧边栏分组的原始逻辑（只是调整了渲染顺序）
- active 判断逻辑（`currentPath === href`）

所有改动都集中在 `DocsLayout.astro` 一个文件里，替换即可。

## 总结

移动端适配的核心思路是：**用断点把桌面端和移动端分成两套布局，移动端把侧边栏变成抽屉，正文占满宽度。**

具体做法：

- 移动端顶栏 + 汉堡按钮，提供打开入口。
- 侧边栏 `fixed` + `-translate-x-full` 默认隐藏，`transition` 滑入滑出。
- 遮罩层 + 点击关闭 + Esc 关闭 + 链接点击关闭。
- 打开时锁 body 滚动，断点切换时复位状态。
- 正文加 `min-w-0` 和 `break-words`，移动端独立 padding。
- 分组排序把「其他」放最后。

整个过程没有动路由、内容集合和核心逻辑，只调整了布局结构和样式，风险可控，桌面端完全不受影响。