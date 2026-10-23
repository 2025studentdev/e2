# e2147dev Blog

基于 **Astro 7 + Tailwind CSS 4** 的静态博客，博客挂载在 `/blog` 路由下。

设计基调：A4 纸式白底细边框、青绿品牌色（`brand`）、加粗直角描边、背景代码符号装饰、亮/暗双主题。除代码复制按钮与暗色切换外**无运行时框架 JS**。

---

## 技术栈

| 项 | 版本 / 说明 |
|---|---|
| Astro | 7.4.0 |
| Tailwind CSS | 4.x（`@import "tailwindcss"` + `@theme` 定义） |
| 内容 | Astro Content Collections（`src/content/blog/*.md\|mdx`） |
| Markdown 增强 | GFM、KaTeX 数学公式、代码高亮（在 `astro.config.mjs` 中配置） |
| 字体 | Inter（sans）、JetBrains Mono（mono） |

---

## 目录结构

```
site/
├─ astro.config.mjs              # Astro 配置（markdown 渲染增强，不影响布局）
├─ package.json
└─ src/
   ├─ pages/
   │  └─ blog/
   │     ├─ index.astro              # /blog           列表第 1 页
   │     ├─ page/
   │     │  └─ [page].astro          # /blog/page/N    列表第 2~N 页
   │     └─ [...slug].astro          # /blog/{slug}    文章详情页
   ├─ layouts/
   │  └─ BaseLayout.astro            # 全站外层骨架 + 背景装饰 + 脚本
   ├─ components/
   │  └─ blog/
   │     ├─ Header.astro             # 顶部导航 + 暗色切换按钮
   │     ├─ Footer.astro             # 页脚
   │     ├─ BlogGrid.astro           # 文章卡片网格（列表页复用）
   │     └─ Pagination.astro         # 分页 UI（列表页复用）
   ├─ config/
   │  └─ pagination.ts               # PAGE_SIZE 等分页常量
   ├─ content/
   │  └─ blog/                       # 所有 markdown 文章
   │     └─ get-start-blog.md        # 含 content collection schema 定义
   └─ assets/
      └─ styles/
         ├─ global.css               # 全局样式：prose、背景网格、装饰符号、复制按钮
         └─ theme.css                # 主题变量：brand 色、字体、dark 变体
```

---

## 路由与页面逻辑

| 路由 | 文件 | 说明 |
|---|---|---|
| `/blog` | `pages/blog/index.astro` | 列表第 1 页 |
| `/blog/page/2` … `/blog/page/N` | `pages/blog/page/[page].astro` | 分页列表（第 2 页起） |
| `/blog/{slug}` | `pages/blog/[...slug].astro` | 文章详情 |

### 数据流（三个页面一致）

```
getCollection('blog')
  → filter(draft !== true)        // 过滤草稿
  → sort(pubDate 降序)            // 新文章在前
  → slice(偏移, 偏移 + PAGE_SIZE) // 按页切片
```

- `PAGE_SIZE` 来自 `src/config/pagination.ts`，**默认 10**。
- 总数 `totalPages = ceil(allPosts.length / PAGE_SIZE)`。

### 分页生成规则（重要）

- **第 1 页由 `index.astro` 独占**，`[page].astro` 的 `getStaticPaths` **只生成第 2~N 页**（避免 `/blog/page/1` 与 `/blog` 重复）。
- 第 2 页的「上一页」指向 `/blog`（不是 `/blog/page/1`）。
- 第 1 页与分页页是**两个独立模板**：改列表页样式时**必须同步改 `index.astro` 与 `page/[page].astro`**，否则翻页后风格会变。

### 文章详情

- `getStaticPaths` 用 `post.id.replace(/\.mdx?$/, '')` 生成 slug。
- 渲染：**Astro 7 用 `const { Content } = await render(post)` + `<Content />`**，不要再用旧版 `post.render()`。
- 外层 `BaseLayout`，正文容器 `max-w-3xl`。

---

## 内容管理（写文章）

在 `src/content/blog/` 下新建 `.md` / `.mdx` 文件，frontmatter 遵循 `get-start-blog.md` 中定义的 schema：

```yaml
---
title: 文章标题
description: 摘要（可选，会显示在列表卡片上）
pubDate: 2026-01-01
updatedDate: 2026-02-01        # 可选
tags: [astro, tailwind]        # 默认 []
draft: false                   # true 则不在任何列表中出现
---
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | string | 必填 |
| `description` | string? | 摘要，列表卡片展示 |
| `pubDate` | Date | 必填，`z.coerce.date()` |
| `updatedDate` | Date? | 可选，详情页显示「更新于」 |
| `tags` | string[] | 默认 `[]`，列表与详情都展示 |
| `draft` | boolean | 默认 `false`，`true` 时完全隐藏 |

> `getStaticPaths` 使用**全量** `getCollection('blog')`（含草稿）生成路径，草稿文章可通过直链访问但不出现在列表。如需彻底隐藏，在 `[...slug].astro` 的 `getStaticPaths` 里也过滤 `!draft`。

---

## 样式系统

### 主题色（`src/assets/styles/theme.css`）

```css
@theme {
  --color-brand-50:  #e8fbfb;
  --color-brand-400: #4dd9da;
  --color-brand-500: #1fcccd;   /* 主色 */
  --color-brand-600: #17a8a9;
  --color-brand-700: #128283;

  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

- 使用方式：`text-brand-600`、`border-brand-500`、`bg-brand-500` 等。
- **目前只有 `50/400/500/600/700` 五级**，若要 `brand-100/200/800/900` 需在此处补定义。
- 暗色变体由 `@custom-variant dark (&:where(.dark, .dark *))` 定义，即 **class 策略**（`html.dark`）。

### 全局样式（`src/assets/styles/global.css`）

包含三块：

1. **`body` 基色**（亮 `gray-100` / 暗 `gray-950`）
2. **`.prose` 文章排版**：标题、段落、链接、行内代码、代码块、列表、引用、图片、表格、`hr`
3. **背景装饰**：
    - `.bg-grid`：44px 网格纹理（品牌色 7% 透明度；暗色下白色 6%）
    - `.deco`：漂浮代码符号（品牌色 15% / 暗色白 10%）
4. **`.copy-btn`**：代码块复制按钮样式（hover 显示、`copied` 态反色）

> ⚠️ `global.css` **只在 `BaseLayout.astro` 中引入一次**，博客组件里不要再重复 `import`，否则样式重复注入。

### 布局层级（改哪里影响哪里）

```
BaseLayout.astro               ← 全站骨架、max-w-[1400px]、边框、背景装饰、脚本
  ├─ Header.astro              ← 导航项、高度 h-16、暗色按钮
  ├─ Footer.astro              ← 页脚
  └─ <slot> (页面内容)
       ├─ index.astro          ← /blog 列表第 1 页
       ├─ page/[page].astro    ← 分页页（须与 index 同步）
       └─ [...slug].astro      ← 文章详情
            └─ BlogGrid.astro  ← 卡片网格（影响所有列表页）
            └─ Pagination.astro← 分页 UI（影响所有列表页）
```

**修改指南：**

| 想改什么 | 改哪里 | 注意 |
|---|---|---|
| 全站最大宽度、外边框、页面外边距 | `BaseLayout.astro` 的 `max-w-[1400px]` / `sm:border-2` / `body` 的 `px/py` | 影响全站 |
| 背景网格 / 装饰符号 | `global.css` 的 `.bg-grid` `.deco` + `BaseLayout.astro` 中装饰 `<div>` | 纯 CSS，删 `<div>` 即去掉装饰 |
| 导航项 / 导航高度 | `Header.astro` 的 `navItems`、`h-16` | — |
| 列表页宽度 / 间距 / 标题 | `index.astro` **和** `page/[page].astro` 的 `<section>`、`<h1>` | **两处同步** |
| 卡片布局（列数、内边距、hover） | `BlogGrid.astro` | 影响所有列表页 |
| 分页按钮样式 | `Pagination.astro` | 影响所有列表页 |
| 文章详情排版 | `[...slug].astro` 的 `<article>` + `global.css` 的 `.prose` | `.prose` 改动影响所有文章正文 |
| 品牌色 | `theme.css` 的 `--color-brand-*` | 全局生效 |
| 代码高亮主题 | `astro.config.mjs` 的 markdown 配置 | 与布局无关 |

---

## 亮 / 暗主题

### 行为

- **默认亮色**。
- 点击 Header 右侧「暗色」按钮切换；按钮文字随状态变为「亮色」。
- 选择写入 `localStorage.theme`（`'dark'` / `'light'`），刷新后保持。
- 暗色：背景 `gray-950`、文字白色；品牌色保持不变。

### 实现（`BaseLayout.astro` 中两段脚本）

```html
<!-- <head> 内：首屏前置，防止暗色闪烁 -->
<script is:inline>
  try {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
</script>

<!-- <body> 末尾：按钮点击逻辑 -->
<script is:inline>
  (() => {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const sync = () => {
      btn.textContent = document.documentElement.classList.contains('dark') ? '亮色' : '暗色';
    };
    sync();
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch (e) {}
      sync();
    });
  })();
</script>
```

- `is:inline` 保证脚本原样内联、不被打包，首屏无闪烁。
- **想改成纯跟随系统（无按钮、零 JS 切换）**：删掉这两段脚本和 `Header.astro` 里的按钮，把 `theme.css` 的 `@custom-variant dark` 改为 `@media (prefers-color-scheme: dark)` 方案即可。代价是**不能手动切换、不记忆**。

---

## JavaScript 说明

全站仅有两处 JS，均**非框架运行时**：

1. **暗色切换**（`BaseLayout.astro`，两段 `is:inline` 脚本，见上）
2. **代码复制按钮**（`BaseLayout.astro` 末尾 `<script>`）：
    - 扫描 `.prose pre`，为每个代码块注入「复制」按钮（`data-copy-ready` 防重复）
    - 点击写入剪贴板，按钮短暂变「已复制」/「失败」
    - 监听 `astro:after-swap`，兼容 View Transitions

除此之外，背景装饰、网格、卡片、分页、排版全部为 **HTML + CSS**，无交互脚本。

---

## 常见维护任务

### 新增导航项

`src/components/blog/Header.astro`：

```js
const navItems = [
  { href: '/', label: '首页' },
  { href: '/blog', label: '博客' },
  // 新增：{ href: '/about', label: '关于' },
];
```

高亮逻辑：`/` 精确匹配，其他用 `currentPath.startsWith(href)`。

### 改分页大小

`src/config/pagination.ts`：

```ts
export const PAGE_SIZE = 10;  // 改成任意正整数
```

改后总页数自动重算，无需动 `index.astro` / `[page].astro`。

### 调整卡片列数

`BlogGrid.astro` 的 `<ul>`：

```html
<ul class="grid gap-5 sm:gap-6 md:grid-cols-2">  <!-- 当前两列 -->
```

- 单列：删 `md:grid-cols-2`
- 三列：改 `md:grid-cols-3`（建议同时给卡片减小 padding）

### 增删背景装饰符号

`BaseLayout.astro` 的装饰 `<div>` 内，每个符号是一个 `<span class="deco ...">`：

```html
<span class="deco top-[20%] right-[6%] text-2xl md:text-4xl">01010011</span>
```

- 位置用 `top-[X%] left/right-[Y%]` 控制
- 大小用 `text-*`
- 注意 HTML 转义：`<` → `&lt;`，`>` → `&gt;`，`{` → `&#123;` 等
- 加 `aria-hidden="true"` 的父容器已设 `pointer-events-none`，不拦截交互

### 改品牌色

`theme.css` 的 `--color-brand-*` 全部替换即可（建议保持 500 为最常用主色，400 为暗色下的亮色替代）。

---

## 注意事项

1. **`global.css` 只引入一次**（在 `BaseLayout.astro`），组件内禁止重复引入。
2. **列表页两处同步**：`index.astro` 与 `page/[page].astro` 是独立模板，改布局/样式要同时改。
3. **`BlogGrid` / `Pagination` 是复用组件**，改动会影响所有列表页；只改 `index.astro` 的 `<section>` 仅影响第 1 页。
4. **`astro.config.mjs` 的 markdown 配置只管渲染**（GFM / KaTeX / 高亮主题），与布局无关，改布局不用动它。
5. **Astro 7 用 `render(post)`**，不要写回旧版 `post.render()`。
6. **草稿的可见性**：`[...slug].astro` 的 `getStaticPaths` 目前包含草稿（可直链访问），如需彻底隐藏需自行加 `.filter(p => !p.data.draft)`。
7. **暗色切换依赖 `is:inline` 脚本**，若将来启用 CSP，需为其放行内联脚本或改用 nonce。
8. **`brand` 色阶不全**：只有 `50/400/500/600/700`，使用 `brand-100/200/300/800/900` 前先在 `theme.css` 补定义。

---

## 本地开发

```bash
cd site
npm install
npm run dev      # 开发服务器
npm run build    # 构建到 dist/
npm run preview  # 预览构建产物
```