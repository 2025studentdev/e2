---
title: 怎么使用 Astro + React 入门？
pubDate: 2026-10-06T18:00:00
description: 从零开始，一步步教你搭建 Astro + React 项目：创建项目、添加 React 集成、编写交互组件，以及理解 client:* 水合指令的核心用法。
tags:
  - Astro
  - React
  - 前端
  - 教程
---

Astro 是一个以内容驱动的静态站点生成器，它默认不向浏览器发送任何 JavaScript，因此生成的网站加载极快。而 React 则拥有成熟的组件生态和强大的交互能力。将两者结合，你既能享受 Astro 的极致性能，又能在需要交互的地方使用 React 组件——这就是 Astro “群岛架构”（Islands Architecture）的核心理念。

##  准备工作

开始之前，你需要确保：

- 本地安装了 **Node.js 18.14.1 或更高版本**。
- 熟悉基本的 **React 组件语法**（JSX、props、useState 等）。
- 了解命令行基本操作。

##  第一步：创建 Astro 项目

在终端中运行以下命令，启动 Astro 的项目创建向导：

```bash
npm create astro@latest my-astro-app
```

向导会依次询问几个问题：

- **项目目录**：默认为 `my-astro-app`，也可以自定义。
- **模板选择**：选择“A basic, helpful starter project (recommended)”，这会创建一个带欢迎页面的基础项目。
- **是否安装依赖**：选择 Yes。
- **是否初始化 Git 仓库**：根据需要选择。

创建完成后，进入项目目录并启动开发服务器：

```bash
cd my-astro-app
npm run dev
```

浏览器访问 `http://localhost:4321`，就能看到 Astro 的默认欢迎页面了。

##  第二步：添加 React 集成

Astro 提供了 `astro add` 命令，可以自动完成 React 集成的安装和配置。在项目根目录运行：

```bash
npx astro add react
```

命令会提示你确认安装，一路按 Yes 即可。这个命令会自动完成三件事：安装 `react`、`react-dom` 和 `@astrojs/react` 包；在 `astro.config.mjs` 中添加 React 集成配置；更新 `tsconfig.json` 以支持 JSX。

完成后，你的 `astro.config.mjs` 应该类似这样：

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
});
```

##  第三步：编写你的第一个 React 组件

在 `src/components/` 目录下创建一个 React 组件文件，例如 `Counter.jsx`：

```jsx
import { useState } from 'react';

export default function Counter({ initialCount = 0 }) {
  const [count, setCount] = useState(initialCount);

  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h2>计数器：{count}</h2>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(count - 1)}>-1</button>
    </div>
  );
}
```

这是一个标准的 React 函数组件，使用了 `useState` 来管理计数状态。注意文件扩展名必须是 `.jsx` 或 `.tsx`，Astro 才能正确识别它。

##  第四步：在 Astro 页面中使用 React 组件

打开 `src/pages/index.astro`，导入并使用刚才创建的 React 组件：

```astro
---
import Counter from '../components/Counter.jsx';
---

<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>Astro + React 入门</title>
  </head>
  <body>
    <h1>欢迎来到 Astro + React</h1>
    <Counter client:load initialCount={5} />
  </body>
</html>
```

关键点在于 `client:load` 这个指令。如果不加任何 `client:*` 指令，React 组件会被渲染为纯静态 HTML，页面上不会有任何交互。加上 `client:load` 后，Astro 会在页面加载时把这个组件的 JavaScript 发送到浏览器，组件随即完成“水合”（hydration），变成可交互的状态。

保存文件后，回到浏览器，你应该能看到一个带初始值 5 的计数器，点击按钮可以正常增减。

##  第五步：理解 client:* 水合指令

Astro 提供了多种水合指令，让你精确控制 React 组件的 JavaScript 何时加载到浏览器。合理选择指令是保持网站性能的关键。

| 指令 | 触发时机 | 适用场景 |
|---|---|---|
| `client:load` | 页面加载时立即水合 | 首屏可见且需要立即交互的组件，如导航栏 |
| `client:idle` | 浏览器空闲时水合 | 优先级较低的交互组件，如页脚的小工具 |
| `client:visible` | 组件滚动进入视口时水合 | 首屏以下的组件，如评论区、图表 |
| `client:media={QUERY}` | 匹配 CSS 媒体查询时水合 | 仅在特定屏幕尺寸下显示的组件 |
| `client:only={FRAMEWORK}` | 完全跳过服务端渲染，只在浏览器中渲染 | 依赖浏览器 API（如 `window`、`canvas`）的组件 |

对于大多数场景，`client:visible` 是最优选择——用户看不到的组件不需要提前加载 JavaScript，能显著减少初始页面体积。

```astro
<!-- 首屏外部的图表组件，滚动到可见时再加载 -->
<Chart client:visible data={chartData} />
```

需要注意的是，使用除 `client:only` 以外的所有指令时，React 组件都会先在服务器上渲染成静态 HTML，然后再在浏览器中水合。这意味着即使 JavaScript 加载失败，用户至少能看到组件的静态内容。而 `client:only` 会完全跳过服务器渲染，组件在服务端不生成任何 HTML，因此必须显式指定框架名称，如 `client:only="react"`。

##  向 React 组件传递 Props

Astro 组件可以向 React 组件传递 props，但传递给已水合组件的 props 必须是可以序列化的数据类型。支持的类型包括：普通对象、number、string、Array、Map、Set、Date、BigInt、URL 等。函数、Symbol 等不可序列化的值无法传递。

```astro
---
import UserCard from '../components/UserCard.jsx';
const user = { name: '张三', role: 'admin' };
---

<UserCard client:load user={user} />
```

##  进阶技巧

**组件划分策略**

不是所有组件都需要用 React 写。一个实用的原则是：**静态内容用 `.astro` 组件，需要交互的部分用 React 组件**。Astro 组件没有客户端运行时开销，非常适合承载页面布局和静态内容。只有在需要状态管理、事件处理或浏览器 API 时，才引入 React 组件。

**多个 JSX 框架共存**

如果你同时在项目中使用了 React 和 Preact（或其他 JSX 框架），Astro 需要额外配置来区分哪个组件属于哪个框架。通过 `include` 选项指定文件路径即可：

```js
// astro.config.mjs
import react from '@astrojs/react';
import preact from '@astrojs/preact';

export default defineConfig({
  integrations: [
    react({ include: ['**/react/*'] }),
    preact({ include: ['**/preact/*'] }),
  ],
});
```

建议将不同框架的组件放在各自的文件夹中，例如 `src/components/react/` 和 `src/components/preact/`，方便维护。

##  常见问题排错

- **启动时报错 “Cannot find package ‘react’”** ：说明 `react` 和 `react-dom` 没有正确安装。运行 `npm install react react-dom` 手动安装即可。
- **React 组件没有交互效果**：检查是否忘记添加 `client:*` 指令。没有指令的组件只会在服务器渲染一次，不会向浏览器发送 JavaScript。
- **组件在服务端报错**：如果组件依赖 `window`、`document` 或 `canvas` 等浏览器 API，服务端渲染会失败。此时使用 `client:only="react"` 跳过服务端渲染。
- **多个 React 组件共享状态**：Astro 不会在多个独立的 React 岛之间共享 React Context。如果需要跨组件共享状态，可以考虑将相关组件包裹在一个更大的 React 组件中，或者使用 Nanostores 等框架无关的状态管理方案。

##  补充说明

Astro + React 的组合最适合**内容驱动但局部需要交互**的网站场景，例如博客、文档站、营销页面等。如果你的项目是一个高度交互的单页应用（SPA），可能直接使用纯 React 配合 Vite 或 Next.js 会更合适。Astro 的哲学是“默认零 JavaScript，按需加载”，当你遵循这个原则来使用 React 组件时，就能在开发体验和最终性能之间取得最佳平衡。

完成以上步骤后，你已经掌握了 Astro + React 的核心用法。接下来可以探索 Astro 的内容集合（Content Collections）、视图过渡（View Transitions）等进阶特性，进一步提升开发效率。
