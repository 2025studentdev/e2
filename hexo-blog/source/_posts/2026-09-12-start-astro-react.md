---
title: Astro + React 从零到一：安装、集成、项目结构与使用指南
date: 2026-09-12 14:39:05
---
Astro 是近年来最值得关注的现代 Web 框架之一，它利用**群岛架构（Islands Architecture）**，默认向客户端发送零 JavaScript，非常适合内容驱动型网站。同时，Astro 对 React 等 UI 框架提供了无缝支持，让你既能享受静态站点的极致性能，又能复用 React 的组件生态。

下面，我将带你从零开始，完成 Astro 的安装、React 集成、项目结构解读，并演示如何在 Astro 中使用 React 组件。

---

## 环境准备与创建项目

确保你的电脑上已安装 **Node.js v18 或更高版本**。然后，在终端中运行以下命令来创建一个新的 Astro 项目：

```bash
npm create astro@latest
```

Astro 的 CLI 向导（代号 Houston）会引导你完成一系列配置：

1. **指定项目目录**：输入 `./my-astro-project`。
2. **选择模板**：建议初学者选择“Empty”或“Basics”模板，以便从零开始理解项目结构。
3. **安装依赖**：向导结束后，进入项目目录并运行 `npm install`。

启动开发服务器：

```bash
npm run dev
```

浏览器访问 `http://localhost:4321`，即可看到 Astro 的欢迎页面。

## 集成 React

Astro 提供了官方的 React 集成，只需一条命令即可自动完成所有配置：

```bash
npx astro add react
```

执行后，CLI 会提示你确认安装。它会自动完成三件事：

1. 安装 `react`、`react-dom` 以及 `@astrojs/react` 依赖。
2. 修改 `astro.config.mjs`，在 `integrations` 数组中添加 `react()`。
3. 在 `tsconfig.json` 中配置 JSX 支持。

集成完成后，你就可以在 `.astro` 文件中直接使用 React 组件了。

> **手动安装（可选）**：如果你偏好手动配置，可以先运行 `npm install @astrojs/react react react-dom`，然后在 `astro.config.mjs` 中导入并添加 `react()` 到 `integrations` 数组。

## 项目结构详解

Astro 采用约定俗成的文件夹布局来管理项目。一个典型的 Astro 项目结构如下：

```text
my-astro-project/
├── public/              # 静态资源，原样复制到构建输出
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/      # 可复用的 UI 组件（.astro / .jsx / .tsx）
│   ├── layouts/         # 页面布局组件
│   ├── pages/           # 页面路由（文件即路由）
│   │   ├── index.astro
│   │   └── about.astro
│   ├── styles/          # 全局样式
│   └── content/         # 内容集合（Markdown / MDX）
├── astro.config.mjs     # Astro 配置文件
├── package.json
└── tsconfig.json
```

各目录的核心职责：

- **`src/pages/`**：这是 Astro 的路由核心。每个 `.astro` 或 `.md` 文件都会自动成为一个页面。例如，`src/pages/about.astro` 对应 `/about` 路由。
- **`src/components/`**：存放可复用的组件。React 组件（`.jsx` / `.tsx`）和 Astro 组件（`.astro`）都可以放在这里。
- **`src/layouts/`**：定义页面共享的 UI 结构（如页头、页脚、导航栏），是 Astro 组件的一种特殊用法。
- **`public/`**：存放不需要 Astro 处理的静态资源，如字体、图片、`robots.txt`。这些文件会被原封不动地复制到构建输出中。
- **`astro.config.mjs`**：项目的核心配置文件，用于添加集成、配置构建选项、设置适配器等。

## 在 Astro 中使用 React 组件

### 创建 React 组件

在 `src/components/` 下新建一个 `Greeting.jsx`：

```jsx
// src/components/Greeting.jsx
import React from 'react';

export default function Greeting({ name }) {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>Welcome to our Astro + React site!</p>
    </div>
  );
}
```

### 在 Astro 页面中使用

打开 `src/pages/index.astro`，导入并使用这个 React 组件：

```astro
---
// src/pages/index.astro
import Greeting from '../components/Greeting.jsx';
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Astro + React</title>
  </head>
  <body>
    <Greeting name="Astronaut" />
  </body>
</html>
```

此时，`Greeting` 组件会在服务器端渲染为静态 HTML，**不会向浏览器发送任何 JavaScript**。

### 添加交互性：客户端指令

如果 React 组件需要交互（如状态、事件处理），你必须使用 `client:*` 指令来激活它。这些指令决定了组件何时在浏览器中“水合”（hydration）：

| 指令 | 说明 |
|------|------|
| `client:load` | 页面加载时立即水合，适用于关键交互组件。 |
| `client:idle` | 浏览器空闲时水合，适合非紧急组件。 |
| `client:visible` | 组件进入视口时才水合，适合首屏以下的交互组件。 |
| `client:media={query}` | 当媒体查询匹配时才水合，适合响应式交互。 |
| `client:only="react"` | 仅在客户端渲染，跳过服务端渲染。 |

例如，给 `Greeting` 添加一个按钮来增加计数：

```jsx
// src/components/Counter.jsx
import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

在 Astro 页面中使用时，添加 `client:load`：

```astro
---
import Counter from '../components/Counter.jsx';
---

<Counter client:load />
```

## 进阶技巧与最佳实践

**1. 优先使用服务端渲染**：只有在需要交互时才添加 `client:*` 指令。默认的零 JavaScript 输出是 Astro 性能优势的核心。

**2. 合理选择水合指令**：对于首屏可见的交互组件使用 `client:load`，对于折叠下方或非关键的组件使用 `client:visible` 或 `client:idle`，以优化加载性能。

**3. 利用内容集合**：如果你在构建博客或文档站，Astro 的**内容集合（Content Collections）** 提供了类型安全的方式来管理 Markdown/MDX 内容。

**4. 布局复用**：将页头、页脚、导航栏等共享结构抽取到 `src/layouts/` 中，让每个页面通过 `<Layout>` 组件包裹，保持代码整洁。

**5. 混合使用 Astro 组件与 React 组件**：Astro 组件（`.astro`）适合静态内容和布局，React 组件适合需要状态和交互的部分。两者可以在同一页面中无缝混用。

## 总结

Astro 提供了一条**渐进式增强**的路径：你可以在大部分页面中使用纯 Astro 组件获得极致的加载性能，只在真正需要交互的地方引入 React 组件。通过 `astro add react` 一行命令即可完成集成，配合 `client:*` 指令精确控制水合时机，让你的站点在性能和开发体验之间取得最佳平衡。

如果你正在考虑将现有的 React 项目迁移到 Astro，或者想为静态站点添加交互功能，Astro + React 组合值得认真评估。

(AI生成)