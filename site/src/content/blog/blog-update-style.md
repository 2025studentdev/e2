---
title: 一次博客大改版：Astro 7 + Tailwind v4 的极简重构
pubDate: 2026-11-20T19:23:49
description: 去掉网格背景和粗边框，修好暗色代码块与 Copy 按钮错位，用 rehype 插件在构建期解决结构问题，重写一套完整的 .prose 样式。记录这次重构的决策、实现与踩坑。
tags:
- Astro
- Tailwind
- 重构
- 博客
---

这个博客的上一版有不少将就：网格线背景和漂浮的代码符号抢注意力，卡片和区块套着一圈 `border-2` 粗边框，暗色模式下代码块是刺眼的纯白，Copy 按钮一横向滚动就跟着跑偏。Markdown 渲染也只覆盖了十来个元素，`h4` 往下、`figure`、`dl`、任务列表全都没样式。

这次一并处理掉。目标很明确：**极简、克制、重阅读，纯 CSS 优先，尽量少用运行时 JS。**

## 定下基调

动手前先把设计规范钉死，避免边改边摇摆。

| 令牌 | 亮色 | 暗色 |
| --- | --- | --- |
| 页面底 | `#F8F9FA` | `#0F1115` |
| 卡片 | `#FFFFFF` | `#161B22` |
| 正文 | `#111827` | `#E6EDF3` |
| 次要文字 | `#6B7280` | `#8B949E` |
| 分割线 | `#E5E7EB` | `rgba(255,255,255,0.08)` |

品牌色 `#1FCCCD` 被限制得很死：只出现在 hover、文字选中背景、标签底、左侧 3px 指示线、引用块边线。**绝不铺大面积。**

字体上，正文 Inter，日期、标签、代码、UI 辅助元素强制 JetBrains Mono。

## 先解决地基

Astro 7 把默认 Markdown 处理器换成了 Sätteri，但项目里的 `remark-math`、`rehype-katex`、`remark-gfm`、`remark-directive` 还想继续用，所以走了官方的 opt-in 路线——显式保留 unified 管线：

```js
import { unified } from '@astrojs/markdown-remark';

markdown: {
  processor: unified({
    gfm: true,
    remarkPlugins: [remarkGfm, remarkMath, remarkDirective, remarkContainers],
    rehypePlugins: [rehypeKatex, rehypeWrapCodeBlock, rehypeFigure, rehypeWrapTable],
  }),
}
```

:::warning
Astro 7 已将 `@astrojs/markdown-remark` 移出默认依赖。不在 `package.json` 里显式声明，本地可能因为残留旧版而通过，CI 会直接挂掉。这是升级时最容易埋的雷。
:::

顺带清理了两个历史包袱：`glob` loader 的 `id` 默认不带扩展名，`post.id.replace(/\.mdx?$/, '')` 是防御性冗余，删掉；`astro:after-swap` 监听在没有 `<ClientRouter />` 的全站里是死代码，也删掉。

## Copy 按钮错位：结构问题，不是定位问题

最初以为调 `top` / `right` 就能修好，试了没用。根因在结构：按钮是 `pre` 的子元素，而 `pre` 同时是 `position: relative` + `overflow-x: auto`。绝对定位子元素相对滚动容器的 padding box 定位，**横向滚动时按钮跟着内容一起滑走**。

正确的结构必须三层：

```html
<div class="code-block">
  <pre><code>...</code></pre>
  <button class="copy-btn">复制</button>
</div>
```

按钮挂在 `.code-block`（`relative`）上，`pre` 独立滚动。位置完全由 CSS 决定。

问题是怎么凭空造出这层 wrapper。纯 CSS 做不到，运行时 JS 包裹又违背"少用 JS"。既然已有 unified 管线，答案很自然：**写一个 rehype 插件，在构建期完成包装。**

```js
function rehypeWrapCodeBlock() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre') return;
      if (!parent || index == null) return;
      if (hasClass(parent, 'code-block')) return;

      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-block'] },
        children: [node],
      };
    });
  };
}
```

零运行时成本，产出即最终结构。

## 暗色代码块：Shiki 双主题要自己切

`shikiConfig` 里配了 `themes: { light: 'github-light', dark: 'github-dark' }`，但 Astro 不会自动按暗色模式切换——Shiki 把亮色内联，暗色值存在 `--shiki-dark` 系列变量里，**需要自己写 CSS 覆盖**。缺这段 CSS，就是"暗色下代码块纯白"的直接原因。

再加一个 `defaultColor: false`，让亮色也不输出内联样式，全部走 CSS 变量，亮暗都严格按规范色板走：

```css
html.dark .prose .astro-code,
html.dark .prose .astro-code span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
  font-style: var(--shiki-dark-font-style) !important;
  font-weight: var(--shiki-dark-font-weight) !important;
  text-decoration: var(--shiki-dark-text-decoration) !important;
}
```

主题切换用的是 `html.classList.toggle('dark')`，选择器正好对齐，JS 一行没动。

## 重写 .prose

旧版手写了 11 类元素，漏了一大片。这次改用 `@tailwindcss/typography` 打底，覆盖全部标准元素，再用 `--tw-prose-*` 变量映射到自定义色板：

```css
.prose {
  --tw-prose-body: var(--fg);
  --tw-prose-headings: var(--fg);
  --tw-prose-quotes: var(--fg);
  --tw-prose-quote-borders: #1FCCCD;
  --tw-prose-pre-bg: var(--code-bg);
  /* ... */
}
```

之后做极客风局部覆盖：

- **无序列表**：放弃圆点，换成 6×2px 短横线
- **有序列表**：`counter` + JetBrains Mono 数字
- **引用块**：无边框，左侧 3px `#1FCCCD` + 极淡青底
- **表格**：无外边框，仅行间 1px 底边，表头极淡灰底
- **分割线**：渐变隐没细线
- **链接**：1px 下划线，hover 时变品牌色
- **`::selection`**：背景 `#1FCCCD`，文字纯黑

表格的移动端横滚也交给 rehype 插件包一层 `.table-wrap`，CSS 加 `overflow-x: auto` 即可，不用任何 JS。

## 图片 alt：纯 CSS 的边界

想用纯 CSS 给图片加 alt 文本样式，但 `<img>` 是替换元素，`::before` / `::after` 在主流浏览器不渲染，这条路走不通。

既然已经有 rehype 管线，干脆把只含单张图的 `<p>` 转成 `<figure>`，把 alt 塞进 `<figcaption>`：

```js
function rehypeFigure() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'p') return;
      // 只处理"仅含一张 img"的段落
      // 有 alt 就追加 figcaption
    });
  };
}
```

图注用等宽字体，顺带成了极客风的一部分。

## 字体：声明不等于加载

早期 `theme.css` 里只写了 `--font-mono: "JetBrains Mono", ...`，但项目里没有任何 `@font-face`。浏览器找不到字体就 fallback，看起来正常，其实一直是 Consolas。

后来用 fontsource variable 包本地托管，一个坑：**variable 包的字体名带 `Variable` 后缀**，不是 `"JetBrains Mono"`。名字对不上，字体加载了也不生效：

```css
--font-sans: "Inter Variable", "Inter", system-ui, ...;
--font-mono: "JetBrains Mono Variable", "JetBrains Mono", ui-monospace, ...;
```

验证方法：DevTools 里 Network 筛 `font` 看是否请求了 `jetbrains-mono-latin-wght-normal.woff2`，Elements 选中 `code` 看 Computed 的 `font-family` 首项是否是 `"JetBrains Mono Variable"`。肉眼最快：代码块里 `=>` 是否渲染成合字箭头。

## 卡片列表与分页

卡片去掉了 `border-2`，靠 `gap` 留白。hover 时轻微上浮 2px，左侧 3px 品牌色竖线浮现，标题变 `#1FCCCD`：

```css
.group:hover .indicator { opacity: 1; }
.group:hover { transform: translateY(-2px); }
```

标签从"带边框"改成实心淡底：`bg-brand-500/10` + `text-brand-600`，等宽字体，微圆角。

分页原本当前页是 `bg-brand-500 text-white` 的大面积品牌色，违反"极其珍贵"原则。改成 `text-brand-500` + 底部 16px 短线，品牌色用量从一整块变成一个点。

## 踩坑记录

**TypeScript 隐式 any**。开了 `// @ts-check` 后，三个 rehype 插件的 `tree` 参数全报 `TS7006`。给每个函数补 `@returns {(tree: HastRoot) => void}`，wrapper 对象先声明带类型的变量再赋值，绕开 `type: 'text'` 被推断成 `string` 的兼容问题。

**弱类型检测**。`hasClass` 原本参数写成 `{ properties?: Record<string, unknown> }`，TS 报 `TS2345`：`Root | Element` 与这个全可选结构"没有共同属性"。原因是 TS 的弱类型检测——全可选属性的类型要求传入值至少有一个属性重合，而 `Root` 根本没有 `properties`。解法是参数收 `unknown`，内部再精确收窄：

```js
function hasClass(node, cls) {
  if (!node || typeof node !== 'object') return false;
  const props = /** @type {{ properties?: { className?: unknown } }} */ (node).properties;
  const c = props?.className;
  return Array.isArray(c) ? c.includes(cls) : c === cls;
}
```

**Tailwind 重复导入**。`global.css` 和 `theme.css` 都 `@import "tailwindcss"`，后者还被 `@reference` 引用，有变量重复注册风险。收敛成 `theme.css` 只放令牌，全局唯一入口 `global.css`。

## 结果

对照一下旧痛点：

| 旧问题 | 现在 |
| --- | --- |
| 网格背景 + 漂浮符号 | 纯色底 |
| 全包围粗边框 | 1px 分割线 + 间距 |
| 暗色代码块纯白 | Shiki 双主题 + CSS 变量 |
| Copy 按钮滚动错位 | rehype 包 wrapper，按钮绝对定位 |
| `.prose` 缺大量元素 | typography 打底 + 极客风覆盖 |
| 分页大面积品牌色 | 文字 + 短线 |
| 字体声明未加载 | fontsource 本地托管 |

整站运行时 JS 只剩两段：主题切换、Copy 按钮点击。其余全部由构建期结构 + CSS 完成。

这次重构最大的收获不是样式本身，而是**把结构问题前移到构建期**：rehype 插件能做的事，不要留给运行时 JS，也不要硬用 CSS 绕。判断标准很简单——纯 CSS 能做到的就用 CSS，做不到但结构可以预生成的，用 rehype；只有真正需要用户交互的，才留 JS。

![winter](../../assets/file/svg/winter-house.svg)