---
title: 一次代码分割引发的崩溃
pubDate: 2026-10-30T21:12:42
description: Astro 7.4 (Vite 8 / Rolldown) 下从 500 kB chunk 警告到构建崩溃的完整排查记录，以及 strictExecutionOrder 的救场。
tags:
- Vite
- Rolldown
- 构建优化
---

## 缘起：一条无害的警告

项目升级到 Astro 7.4 之后，`npm run build` 每次都会甩出这条：

```
(!) Some chunks are larger than 500 kB after minification.
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
```

构建本身是成功的，54 个页面照样生成。但警告里那句 `build.rolldownOptions.output.codeSplitting` 暗示了一个重要事实：**Astro 7.4 底层用的是 Vite 8，默认打包器已经从 Rollup 换成了 Rust 写的 Rolldown**。这意味着过去那套 `manualChunks` 的写法全部作废，得按 Rolldown 的新 API 来。

## 拒绝自欺欺人

最省事的做法是把 `chunkSizeWarningLimit` 调到 1000，警告立刻消失。但这个项目里有一堆 CSR 游戏页（`/games/play/3d-t`、`physics-vt`……），全靠客户端打包的 JS 撑着。调高阈值只是把问题藏起来，首屏该下载的还是那么多字节。

真正的目标是：**搞清楚到底哪个 chunk 超了，然后把它拆小。**

## 第一版：手动分组

Rolldown 的代码分割入口是 `build.rolldownOptions.output.codeSplitting.groups`，一个数组，每项用 `test` 正则匹配模块路径。第一版我把三个明显的大家伙单独拎出来：

```ts
export const codeSplittingConfig = {
  groups: [
    { name: 'vendor-react',  test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,  priority: 30 },
    { name: 'vendor-svelte', test: /node_modules[\\/](?:svelte|@sveltejs)[\\/]/,           priority: 25 },
    { name: 'vendor-three',  test: /node_modules[\\/]three(?:[\\/]|$)/,                     priority: 20 },
  ],
};
```

构建——警告还在。

原因很简单：这三个组只覆盖了 `node_modules` 里的一小撮，剩下的依赖（`@astrojs/*`、`unist-util-*`、`remark-*` 的客户端部分……）仍然被 Rolldown 堆进默认 chunk，一起超标。

## 第二版：加兜底 + maxSize（翻车现场）

直觉解法：加一个兜底的 `vendor` 组接住所有剩余 `node_modules`，再给它设置 `maxSize: 450_000`，让 Rolldown 自动把超大的堆拆成多个 ≤ 450 kB 的子 chunk。

```ts
{
  name: 'vendor',
  test: /node_modules[\\/]/,
  priority: 5,
  maxSize: 450_000, // ← 这个数字后来成了祸根
},
```

警告确实消失了。但构建直接崩溃：

```
DOMException [NotSupportedError]: Unrecognized algorithm name
    at SubtleCrypto.importKey (node:internal/crypto/webcrypto:891:15)
    at decodeKey (dist/.prerender/chunks/vendor_CB2F2cdm.mjs:102:23)
    at deserializeManifest (dist/.prerender/chunks/vendor_CB2F2cdm.mjs:171:14)
    at setup (node_modules/astro/dist/core/build/default-prerenderer.js:17:20)
```

报错发生在 prerender 阶段：Astro 加载内部运行时，反序列化 manifest，调用 Web Crypto 的 `importKey`——然后发现算法名是 `undefined`。

## 根因：maxSize 切断了执行顺序

`importKey` 的报错只是替罪羊。真正的问题是 **`maxSize` 把有严格顺序依赖的 Astro 内部模块强行切到了不同文件**。

Astro 的 manifest 反序列化链路大致是这样：

```
某模块定义加密算法常量 ──► 被引用 ──► deserializeManifest ──► importKey(算法常量)
```

默认情况下，这些模块在同一个 chunk 里，源码顺序天然保证了「定义先于使用」。但 `maxSize` 强制拆分时，物理文件被切开，加载顺序改由 chunk 之间的 import 图决定——在某个边界上，`importKey` 的执行**跑到了算法常量定义之前**，拿到的就是 `undefined`。

这正是 Rolldown 文档里警告过的事：手动代码分割如果改变副作用发生时机，会破坏应用行为。`maxSize` 是一种「强行切开」的操作，对顺序敏感的内部模块就是灾难。

## 救场：strictExecutionOrder

Rolldown 提供了一个专治此病的选项：

```js
rolldownOptions: {
  output: {
    strictExecutionOrder: true,
    codeSplitting: codeSplittingConfig,
  },
},
```

开启后，每个模块体会被包一层 `init_*()` 延迟包装器，**无论模块被物理拆到哪个 chunk，顶层代码都按源码拓扑顺序执行**。执行顺序从此与文件布局解耦。

代价是约 **7% 的 gzip 体积增长**（包装器开销）。但比起构建崩溃，这是值得付的保险费。

## 但仅仅开保险还不够

`strictExecutionOrder` 能兜住顺序，但更稳妥的做法是**从分组源头减少对 Astro 内部模块的拆分**。两个改动：

1. **兜底 `vendor` 组去掉 `maxSize`**。不再强行切开剩余依赖，让它们自然聚合——顺序问题从源头上就少了一大半。
2. **新增 `vendor-astro-internal` 组，优先级最高（35）**。把 Astro 自身的运行时（包括 manifest 反序列化和 Crypto 工具链）聚合成一个整体，避免被 React/Svelte 分组「吸走」部分模块导致内部链路断裂。

顺带给 `vendor-three` 加上 `entriesAware: true`。Rolldown 默认 `entriesAware: false`，所有用到 three 的入口共享同一个 chunk；开启后按实际入口拆分，只加载当前页面真正用到的部分，再用 `entriesAwareMergeThreshold` 把碎片重新合并。

## 最终配置

### `src/config/chunk-big.ts`

```ts
// src/config/chunk-big.ts

/**
 * Rolldown 代码分割分组（Astro 7.4 / Vite 8）
 *
 * 核心策略：
 *  1. 大型库（React / Svelte / Three）用高 priority 单独聚合，便于长效缓存；
 *  2. Astro 内部运行时单独聚合，避免被其他 vendor 拆分干扰；
 *  3. 兜底 vendor 组只负责「接住」剩余模块，不设 maxSize，
 *     避免手动强拆触发执行顺序副作用（本次 Crypto 错误的根因）；
 *  4. 执行顺序安全交给 output.strictExecutionOrder: true 兜底。
 */

export const codeSplittingConfig = {
  groups: [
    // ── Astro 内部运行时（最高优先级，确保聚合）────────────────
    {
      name: 'vendor-astro-internal',
      test: /node_modules[\\/](?:\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?(?:astro|@astrojs)[\\/]/,
      priority: 35,
      // 不设 maxSize：Astro 内部模块有严格执行顺序依赖，不可强拆
    },

    // ── React 家族 ──────────────────────────────────────────
    {
      name: 'vendor-react',
      test: /node_modules[\\/](?:\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?(?:react|react-dom|scheduler)[\\/]/,
      priority: 30,
      maxSize: 200_000,
    },

    // ── Svelte 运行时 ───────────────────────────────────────
    {
      name: 'vendor-svelte',
      test: /node_modules[\\/](?:\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?(?:svelte|@sveltejs)[\\/]/,
      priority: 25,
      maxSize: 200_000,
    },

    // ── Three.js（游戏页重型依赖）─────────────────────────
    {
      name: 'vendor-three',
      test: /node_modules[\\/](?:\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?three(?:[\\/]|$)/,
      priority: 20,
      maxSize: 400_000,
      entriesAware: true,
      entriesAwareMergeThreshold: 50_000,
    },

    // ── 兜底：剩余所有 node_modules ─────────────────────────
    // 不设 maxSize。让 Rolldown 自然聚合剩余依赖，
    // 执行顺序安全由 strictExecutionOrder 保证。
    {
      name: 'vendor',
      test: /node_modules[\\/]/,
      priority: 5,
    },
  ],
};
```

### `astro.config.mjs`（关键片段）

```js
import { codeSplittingConfig } from './src/config/chunk-big.ts';

export default defineConfig({
  // ...
  vite: {
    plugins: [tailwindcss()],
    build: {
      rolldownOptions: {
        output: {
          // 保证跨 chunk 的模块执行顺序与源码拓扑顺序一致
          strictExecutionOrder: true,
          codeSplitting: codeSplittingConfig,
        },
      },
    },
  },
  // ...
});
```

## 结果

```
21:10:15 [build] 54 page(s) built in 2.22s
21:10:15 [build] Complete!
```

- 500 kB 警告消失
- Crypto 错误不再出现
- 构建时间从 4.45s 降到 2.22s（拆掉的内部模块堆反而让冷启动更快）

## 还没完：运行时才是治本

构建产物的 chunk 体积达标了，但 `/games/play/3d-t` 这类页面如果用 `client:only` 或 `client:load`，`vendor-three` 仍然会在**页面一打开就下载**。首屏 JS 总量没变。

真正的最后一刀在运行时：

```astro
<!-- 滚动到游戏区域才加载 three 相关代码 -->
<Game3D client:visible="react" />
```

```jsx
// Game3D.jsx
import { lazy, Suspense } from 'react';
const ThreeScene = lazy(() => import('./ThreeScene'));

export default function Game3D() {
  return (
    <Suspense fallback={<div>Loading 3D...</div>}>
      <ThreeScene />
    </Suspense>
  );
}
```

动态 `import()` 会创造 Rolldown 可识别的异步 chunk 边界，`client:visible` 确保它初始不请求。这两步叠加，`vendor-three` 在首屏根本不会被下载。

## 三条经验

1. **`manualChunks` 在 Vite 8 已死**，改用 `codeSplitting.groups` 数组 + `test` 正则。旧配置不会报错，会静默失效。
2. **手动分组只做「聚合」，不做「拆分」**。把该在一起的模块放一起（如 `vendor-astro-internal`），不要用 `maxSize` 强行切开有顺序依赖的模块。
3. **`strictExecutionOrder: true` 是手动分组的保险绳**。7% 的 gzip 体积换构建稳定性，值。

至于 `chunkSizeWarningLimit`——那是给已经审计过、确认体积无法再降的 bundle 用的安慰剂。没审计之前调高它，只是自欺欺人。
