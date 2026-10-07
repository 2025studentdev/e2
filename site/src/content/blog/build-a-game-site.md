---
title: 怎么使用 Astro + Svelte + Tailwind 构建游戏索引页面？
pubDate: 2026-10-07T12:00:00
description: 一种数据驱动的静态站点游戏索引方案：单一入口页面、Svelte 交互组件、隔离的游戏本体，以及构建期常见问题的处理。
tags:
  - Astro
  - Svelte
  - Tailwind CSS
---

# 怎么使用 Astro + Svelte + Tailwind 构建游戏索引页面？

## 1. 需求与约束

为站点增加一个游戏索引区域，需满足以下约束：

1. **单一入口页面**。所有游戏在同一个页面内全部渲染，不引入分页逻辑与动态路由。游戏数量有限，分页带来的复杂度不具收益。
2. **交互部分使用 Svelte**。页面路由由 Astro 承担，涉及客户端状态的部分（如搜索过滤）封装为 Svelte 组件。
3. **游戏本体与主站隔离**。每个游戏为独立的静态 HTML 文档，置于各自目录中，自带样式与脚本，不继承主站布局。
4. **数据驱动，新增游戏时仅修改单一位置**。以 TypeScript 数组作为唯一数据源，新增条目即可，页面与组件不需改动。

第 4 条约束决定了后续的目录划分与组件边界。

## 2. 目录结构

```
src/
├── components/
│   └── svelte/
│       └── game-page/
│           ├── games.ts          数据源
│           ├── icons.svelte      图标组件
│           ├── GameCard.svelte   单卡片组件
│           └── GameGrid.svelte   搜索与网格容器
└── pages/
└── games/
├── index.astro           索引页
└── play/
├── snake/index.html
├── 2048/index.html
└── tetris/index.html
```

两项结构决策：

- **数据文件置于组件目录内**。`games.ts` 仅服务于 `game-page` 模块，与组件同目录可维持模块内聚，整个目录可独立迁移而不破坏引用关系。
- **游戏以「目录 + index.html」组织，而非单文件**。游戏可能包含脚本、样式、图片、音频等资源，目录形式便于同目录相对引用。其访问路径为 `/games/play/<slug>/`。

## 3. 数据层

```ts
// src/components/svelte/game-page/games.ts

export interface GameEntry {
  /** 目录名，须与 src/pages/games/play/<slug>/ 一致 */
  slug: string;
  /** 展示名称 */
  name: string;
  /** 描述文本 */
  description: string;
}

export const games: GameEntry[] = [
  {
    slug: 'snake',
    name: '贪吃蛇',
    description: '方向键控制，吃到食物变长，撞墙或撞自己结束。',
  },
  {
    slug: '2048',
    name: '2048',
    description: '滑动合并相同数字，目标是拼出 2048 方块。',
  },
];

/** 生成游戏访问路径 */
export const gamePath = (slug: string): string => `/games/play/${slug}/`;
```

数据模型仅保留三个字段。曾考虑 `tags`、`cover`、`date` 等字段，在当前需求下均无使用场景，故不予引入。`gamePath` 作为路径生成的唯一出口，后续若调整路由规则只需修改此函数。

**约束**：该模块仅可导出纯数据与纯函数。`GameEntry` 数组需通过 Astro 的 `client:load` 指令序列化至客户端，若包含 `Date` 实例、类实例或函数字段，序列化将失败。

## 4. 组件层

三个组件，职责分离。

### 4.1 图标组件

```svelte
<!-- src/components/svelte/game-page/icons.svelte -->
<script lang="ts">
  export let name: 'search' | 'close' | 'arrow' | 'empty';

  // class 为 JavaScript 保留字，不可直接用作变量名
  let className: string = 'w-5 h-5';
  export { className as class };
</script>

{#if name === 'search'}
  <svg width="20" height="20" class={className} viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
{:else if name === 'close'}
  <!-- ... -->
{/if}
```

采用内联 SVG，不引入图标库。当前仅需四个图标，引入外部依赖的成本高于收益。

### 4.2 卡片组件

```svelte
<!-- src/components/svelte/game-page/GameCard.svelte -->
<script lang="ts">
  import type { GameEntry } from './games';
  import { gamePath } from './games';
  import Icon from './icons.svelte';

  export let game: GameEntry;
  export let index: number;
</script>

<a href={gamePath(game.slug)}
   class="group relative flex flex-col rounded-lg border border-slate-200
          bg-white p-5 transition-all duration-200 ease-out
          hover:border-slate-900 hover:shadow-[0_2px_12px_rgba(15,23,42,0.06)]
          dark:border-slate-800 dark:bg-slate-900">
  <span class="mb-4 font-mono text-xs tabular-nums text-slate-300">
    {String(index + 1).padStart(2, '0')}
  </span>

  <h3 class="text-[15px] font-semibold leading-tight tracking-tight text-slate-900">
    {game.name}
  </h3>

  <p class="mt-2 flex-1 text-[13px] leading-relaxed text-slate-500">
    {game.description}
  </p>

  <div class="mt-6 flex items-center gap-1 text-slate-300
              transition-colors duration-200 group-hover:text-slate-900">
    <span class="text-xs font-medium tracking-wide">进入</span>
    <Icon name="arrow" class="h-3.5 w-3.5 transition-transform
                               group-hover:translate-x-0.5" />
  </div>
</a>
```

`GameCard` 仅接收单条数据，不涉及搜索状态与布局逻辑。

### 4.3 网格组件

```svelte
<!-- src/components/svelte/game-page/GameGrid.svelte -->
<script lang="ts">
  import type { GameEntry } from './games';
  import GameCard from './GameCard.svelte';
  import Icon from './icons.svelte';

  export let games: GameEntry[];

  let query = '';

  $: keyword = query.trim().toLowerCase();
  $: filtered = keyword
    ? games.filter((g) =>
        [g.name, g.description, g.slug].join(' ').toLowerCase().includes(keyword)
      )
    : games;
</script>

<div class="space-y-8">
  <div class="relative max-w-xs">
    <!-- 搜索输入框 -->
  </div>

  {#if filtered.length > 0}
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each filtered as game, i (game.slug)}
        <GameCard {game} index={i} />
      {/each}
    </div>
  {:else}
    <!-- 空状态 -->
  {/if}
</div>
```

搜索逻辑由 Svelte 响应式声明实现，不引入状态管理库。过滤字段为 `name`、`description`、`slug` 的拼接结果，大小写不敏感。

## 5. 页面层

```astro
---
// src/pages/games/index.astro
import '../../styles/global.css';
import { games } from '../../components/svelte/game-page/games';
import GameGrid from '../../components/svelte/game-page/GameGrid.svelte';

const title = '游戏';
---

<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
</head>
<body class="min-h-screen bg-slate-50 antialiased dark:bg-slate-950">
  <main class="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8 lg:py-20">
    <header class="mb-12 border-b border-slate-200 pb-8 dark:border-slate-800">
      <h1 class="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
        {title}
      </h1>
      <p class="mt-3 text-sm text-slate-500 dark:text-slate-400">
        {games.length} 个可玩项目
      </p>
    </header>

    <GameGrid games={games} client:load />
  </main>
</body>
</html>
```

页面本身不包含业务逻辑，仅负责导入数据、导入组件并传递属性。

`client:load` 指令为必需项。Astro 默认仅将 Svelte 组件渲染为静态 HTML，未添加该指令时组件不会在客户端激活，搜索框的输入与过滤不会生效。

## 6. 构建期问题与处理

### 6.1 `class` 为保留字

在 Svelte 组件中使用 `export let class` 会导致编译期错误：

```
Unexpected keyword 'class'
```

处理方式为内部使用 `className`，通过导出别名映射：

```ts
let className: string = 'w-5 h-5';
export { className as class };
```

外部仍以 `<Icon class="w-4 h-4" />` 形式调用。

### 6.2 引用不存在的模块导致页面空白

页面呈现空白，浏览器控制台无输出，构建终端报模块解析失败。原因为引入了项目中不存在的布局模块：

```astro
import Layout from '../../layouts/Layout.astro';
```

Astro 在模块解析失败时返回 500，页面不渲染。由于错误仅出现在构建终端，浏览器端无提示，排查时应优先检查终端输出。

### 6.3 Tailwind 未生效

现象为图标尺寸异常、布局失效、样式未应用。

原因为 Tailwind 的类名依赖其编译产出的 CSS 文件。独立 HTML 页面不继承任何布局，站点其他位置引入的全局样式对其无效，须在该页面内显式引入：

```astro
import '../../styles/global.css';
```

此外，Tailwind v4 不再通过 `@astrojs/tailwind` 集成接入，改为使用 Vite 插件：

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

该类问题的本质是：类名出现在标记中，并不代表对应样式已被加载。

## 7. 视觉设计

初版实现存在装饰过度的问题：圆角过大、阴影过重、悬停位移幅度过大。调整方案为减少装饰元素：

| 调整项 | 调整前 | 调整后 |
|---|---|---|
| 卡片标题 | 大字号 | 小字号 + 等宽序号 |
| 悬停反馈 | 位移 + 重阴影 | 边框色变化 + 极淡阴影 |
| 搜索框 | 宽、大圆角 | 收窄、小圆角、聚焦时边框加深 |
| 背景 | 纯白 | 浅灰底色衬托白色卡片 |

设计原则为通过明度差建立层级，而非依赖阴影堆叠。全局底色为 `bg-slate-50`，卡片为 `bg-white`，两者之间已形成足够的视觉分离。

序号采用等宽字体与 `tabular-nums`，作为页面上唯一的装饰性元素。整体配色为中性色阶，不使用渐变。

## 8. 扩展流程

在现有设计下，新增一个游戏包含两个步骤。

**第一步**，创建目录与入口文件：

```
src/pages/games/play/minesweeper/index.html
```

**第二步**，在 `games.ts` 中追加条目：

```ts
{
  slug: 'minesweeper',
  name: '扫雷',
  description: '翻开格子，避开地雷，数字提示周围雷数。',
}
```

完成后，索引页将自动渲染对应卡片，访问路径为 `/games/play/minesweeper/`。`index.astro` 与各组件均无需修改。

## 9. 小结

该方案的核心在于将新增成本集中在单一数据源上。索引页的渲染完全由 `games` 数组驱动，页面层与组件层不包含与具体游戏相关的信息。这一约束使得：

- 新增游戏时，改动范围限定为「新建目录 + 追加一条数据」；
- 数据模型与展示逻辑解耦，字段调整不影响组件结构；
- 游戏本体与主站隔离，各自独立演进。

在实现层面，需注意三点：Svelte 组件的 `class` 保留字处理、Astro 中模块解析失败的错误定位方式，以及 Tailwind CSS 在独立页面中的显式引入。
