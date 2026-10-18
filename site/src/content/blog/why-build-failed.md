---
title: 一次 Astro 小版本更新，为什么让 Cloudflare Pages 构建挂了
pubDate: 2026-10-18T18:30:00
description: 记录astro由7.3.5升级到7.4.0的兼容性情况
tags:
  - Cloudflare
  - 升级
  - astro
---

## 升级之后，构建突然失败

项目一直用 Astro 构建，部署在 Cloudflare Pages 上，平时升级小版本从来没出过问题。这次把 Astro 从 `7.3.5` 更新到 `7.4.0`，代码没动，本地一切正常，但推送后 Cloudflare Pages 的构建直接失败了。

日志关键部分如下：

```text
Detected the following tools from environment: npm@10.9.2, nodejs@22.16.0
...
Executing user command: npm run build
> site@0.0.1 build
> astro build

Node.js v22.16.0 is not supported by Astro!
Please upgrade Node.js to a supported version: ">=22.22.0"
```

与此同时，`npm install` 阶段也出现了一串 `EBADENGINE` 警告：

```text
npm warn EBADENGINE   package: 'astro@7.4.0',
npm warn EBADENGINE   required: { node: '>=22.22.0', ... },
npm warn EBADENGINE   current: { node: 'v22.16.0', npm: '10.9.2' }
```

报错非常直接：**Cloudflare 构建环境用的 Node.js 是 `22.16.0`，但 Astro 在 `7.40` 中把最低要求提到了 `22.22.0`。**

## 问题不在代码，在“及格线”被抬高了

升级前，Astro `7.3.5` 的 Node.js 要求低于 `22.16.0`，Cloudflare Pages 的默认版本刚好够用，构建一直正常。但从 `7.3.5` 到 `7.4.0` 的这次更新中，Astro 官方通过 PR #18277 **将 Astro 本身以及所有官方集成包的最低 Node.js 版本统一上调到了 `22.22.0`**。

更具体地说，这个版本下限被“钉”在了 StackBlitz 所支持的最后一个 Node.js 22 版本上，所以是 `22.22` 而非 `22.23`。Astro 的发布说明中也明确写道，这一调整“符合 Astro 的 Node.js 支持策略”。

换句话说，**你的代码和环境都没变，变的是 Astro 对“环境够不够用”的定义。** 一次看似不起眼的小版本更新，悄悄抬高了 CI 环境必须满足的硬门槛。

## Cloudflare Pages 的默认 Node.js 恰好卡在门槛之下

Cloudflare Pages 的构建镜像并非永远最新。根据其官方文档，当前构建环境的**默认 Node.js 版本正是 `22.16.0`**，虽然支持任意版本，但需要显式指定才能覆盖默认值。

而项目里此前没有设置任何版本覆盖配置，于是 Cloudflare 一直使用默认的 `22.16.0`。升级前这个版本满足 Astro 的要求，升级后则正好低于新门槛，构建在 `astro build` 阶段被 Astro 的版本检查拦下。

## 解决：在 Cloudflare Pages 中指定 Node.js 版本

Cloudflare Pages 提供了两种方式来覆盖默认 Node.js 版本，任选一种即可。

### 方案一：添加 `NODE_VERSION` 环境变量（推荐）

在 Cloudflare Dashboard 中打开 Pages 项目，进入 **Settings → Variables and secrets**，添加：

| 项目 | 值 |
| :--- | :--- |
| Variable name | `NODE_VERSION` |
| Value | `24` |
| Type | Plaintext |

**Production** 和 **Preview** 两个环境都要添加，或者分别各加一次。保存后进入 **Deployments** 点击 **Retry deployment**，或推一个空 commit 触发新构建。

`24` 满足 Astro 的 `>=22.22.0` 要求。如果写主版本号不生效，可以换成具体版本号，例如 `24.10.0`，或者保守回退到 Astro 明确要求的下限 `22.22.0`。

Cloudflare 官方文档也确认，`NODE_VERSION` 环境变量是覆盖默认 Node.js 版本的标准方式。

### 方案二：在仓库中添加 `.node-version` 文件

如果希望版本锁定随代码一起管理，可以在项目根目录（本项目为 `site/`）下新建 `.node-version` 文件，写入：

```text
24
```

提交推送后，Cloudflare Pages 会自动读取这个文件来固定构建时的 Node.js 版本，无需在 Dashboard 中手动设置。`.node-version` 和 `.nvmrc` 都是 Cloudflare 支持的版本文件。

### 怎么确认生效

重新构建后，观察日志中的这一行：

```text
Detected the following tools from environment: npm@..., nodejs@24.x
```

只要从 `nodejs@22.16.0` 变成 `nodejs@24.x`，Astro 的版本检查就会通过，`astro build` 可以正常执行。

## 总结

| 项目 | 内容                                               |
| :--- |:-------------------------------------------------|
| 触发场景 | Astro 从 `7.3.5` 升级到 `7.4.0`                      |
| 根本原因 | Astro 7.4.0 将最低 Node.js 要求从较低版本提升至 `>=22.22.0`   |
| 冲突点 | Cloudflare Pages 默认 Node.js 为 `22.16.0`，低于新门槛    |
| 解决方式 | 设置 `NODE_VERSION=24` 环境变量，或添加 `.node-version` 文件 |
| 验证标志 | 构建日志出现 `nodejs@24.x`                             |

这件事的教训是：**依赖的小版本更新，不只会改代码行为，也可能悄悄改变 CI 环境的最低要求。** 当构建在“本地正常、线上失败”之间出现裂痕时，先别怀疑代码——看看依赖的版本门槛，以及 CI 环境的默认值，往往答案就在那里。
