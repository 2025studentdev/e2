---
title: "我是怎样修复表格和一级标题的 Bug 的"
description: "Astro + Tailwind Typography 下，表格渲染与 prose 标题样式的排查记录"
pubDate: 2026-10-05T15:30:00
tags: ["Astro", "Tailwind", "Markdown", "博客"]
draft: false
---
---

# 我是怎样修复表格和一级标题的 Bug 的

博客用 Astro 7 + Tailwind CSS 4 + `@tailwindcss/typography` 搭的，写文章走 Content Collections，Markdown 解析层用了 `remark-gfm`、`remark-math`、`rehype-katex`，代码高亮交给 Shiki。

某天写测试文，想验证一下各种 Markdown 元素渲染是否正常。结果大部分都对：标题、列表、引用、代码块、KaTeX 行内和块级公式、删除线、callout，全都正常。

**唯独两样不对：表格压根"显示不出来"，一级标题没有任何样式。**

其他标题（h2/h3/h4）都好好的，就 h1 是裸的。表格也是——写的是 Markdown 表格，页面上看不到任何表格的样子。

## 第一反应：Markdown 没被 GFM 解析？

这是最容易想到的方向。表格语法是 GFM 扩展，如果解析器没启用 GFM，那表格就会退化成普通段落，看起来"没显示"。

打开 `astro.config.mjs`，我的配置长这样：

```js
markdown: {
  processor: unified({
    remarkPlugins: [remarkGfm, remarkMath, remarkDirective, remarkContainers],
    rehypePlugins: [rehypeKatex],
  }),
}
```

一开始怀疑 `processor: unified({...})` 这个写法"接管"了整条 Markdown 管线，导致 Astro 内部的 `remark-rehype` 默认配置（比如 GFM 的表格转换）没生效。

于是我把 processor 拆掉，改成顶层插件：

```js
markdown: {
  remarkPlugins: [remarkGfm, remarkMath, remarkDirective, remarkContainers],
  rehypePlugins: [rehypeKatex],
}
```

重启，**控制台报了一堆 deprecated 警告**：

```
[astro] `markdown.remarkPlugins`, `markdown.rehypePlugins`, and `markdown.remarkRehype` are deprecated. 
Pass them to `unified({...})` from `@astrojs/markdown-remark` directly instead.
```

行吧，Astro 7 明确告诉我：插件要传给 `unified`，别写在顶层。我又改回 processor 的写法，顺手加上 `gfm: true`：

```js
markdown: {
  gfm: true,
  processor: unified({
    remarkPlugins: [remarkGfm, remarkMath, remarkDirective, remarkContainers],
    rehypePlugins: [rehypeKatex],
  }),
}
```

重启。**表格还是老样子。**

## 转折：去浏览器里看真实的 HTML

折腾到这里已经有点烦躁了。停下来想了一下：我一直在改配置，但**从没看过页面实际渲染出什么**。

F12，右键表格位置 → 检查。

然后我就愣住了：

```html
<table>
  <thead>
    <tr><th>语法</th><th>说明</th><th>示例</th></tr>
  </thead>
  <tbody>
    <tr><td>加粗</td><td>强调</td><td><strong>text</strong></td></tr>
    ...
  </tbody>
</table>
```

**表格一直都在。**

解析没有任何问题——`remark-gfm` 一直在正常工作，`<table>`、`<thead>`、`<tbody>`、`<tr>`、`<td>` 全都规规矩矩地生成了。

问题根本不是"识别不了表格"，是"表格没有样式"。默认的 HTML 表格就是一个裸框，没有边框、没有内边距、没有对齐，远看就像一段挤在一起的文字——所以第一眼看上去像"没显示"。

## 真相一：`prose` 的表格样式没生效

既然 HTML 里已经有 `<table>`，那问题就落在 `@tailwindcss/typography` 这边。`prose` 类应该给表格默认加上边框和间距，但显然没起作用。

与其继续深挖 `@plugin` 到底有没有被 Tailwind 4 正确加载（这类问题本身就很玄学），不如直接在 `global.css` 里补一段 CSS 兜底：

```css
.prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
  font-size: 0.875em;
  line-height: 1.7;
}

.prose thead th {
  padding: 0.5em 0.75em;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid currentColor;
}

.prose tbody td {
  padding: 0.5em 0.75em;
  border-bottom: 1px solid;
  border-color: rgb(0 0 0 / 0.1);
}

.dark .prose tbody td {
  border-color: rgb(255 255 255 / 0.15);
}
```

存盘，刷新。表格立刻有了边框、内边距、行间距——终于正常了。

## 真相二：`prose` 里的 h1 本来就没有样式

表格修好之后，回头看一级标题。同样的思路，去查 `@tailwindcss/typography` 的行为：

**`prose` 类默认不给 h1 加任何样式。**

这不是 bug，是设计如此。插件的作者默认 h1 是"文章标题"，应该出现在 `prose` 容器**外面**，比如文章页布局里的那个大标题。`prose` 内部一般只用 h2、h3、h4，从正文的二级标题开始。

所以正文里如果手写 `# 一级标题`，`prose` 会当它不存在——它确实什么都没有。

解决方法两种：

**方法一（推荐）**：正文里不用 h1，从 h2 开始写。文章标题交给布局文件里的 `<h1>` 负责，语义上也更合理——一篇文章本来就该只有一个 h1。

**方法二（如果你真的想在正文里用 h1）**：手动补样式。

```css
.prose h1 {
  font-size: 2.25em;
  font-weight: 800;
  line-height: 1.1111111;
  margin-top: 0;
  margin-bottom: 0.8888889em;
}
```

我最后选了方法一，正文里从 `##` 起步，这样也少一段要维护的 CSS。

## 复盘

整个过程其实不复杂，但我在错误的方向上兜了好几圈。回头看，有几点值得记下：

**第一，先看渲染结果，再改配置。** 我上来就怀疑配置，改了两轮 `astro.config.mjs`，直到打开 DevTools 才意识到问题根本不在解析层。浏览器里那段 HTML 比任何配置都更能说明问题。

**第二，`prose` 只管样式，不管解析。** `@tailwindcss/typography` 的唯一职责是给已经生成的 HTML 元素应用好看的样式。表格能不能被解析，取决于 `remark-gfm`；表格看起来好不好看，取决于 `prose` 和自定义 CSS。这两件事要分开排查。

**第三，`processor: unified({...})` 会接管整条管线。** 一旦用它，Astro 内部的默认设置就不再兜底了——所有该加的插件你都得自己加全。这也是为什么控制台会警告"插件要传给 unified"，同时又提示顶层写法的 deprecated。

**第四，`prose` 里 h1 没样式是设计，不是 bug。** 下次再遇到"某个元素在 prose 里没样式"，先查官方文档的默认值，而不是第一时间怀疑自己配置错了。

表格和 h1 都正常了。这套测试文现在全部通过。

---
