---
title: 一键新建 Astro 博客文章：自动写 frontmatter，还能防重复
pubDate: 2026-10-30T15:20:00
description: 用 npm run 和一段 Node 脚本，给 Astro 博客加一个 e2blog create 命令，零全局安装、零 PATH 修改，顺手搞定终端彩色输出。
tags:
- astro
- nodejs
- cli
- PowerShell
---
每次写新文章都要手动新建 `.md`、手敲 frontmatter、再检查文件名有没有撞车，写多了就烦。Astro 本身没提供这类脚手架命令，但 Node.js 生态里加一个「项目内专用命令」其实非常简单——关键是别用 `npm link` 或 `npm i -g`，那会把命令注册进全局 PATH，换到别的项目又撞名。

下面这套方案只在项目内闭环，命令永远跟着 `package.json` 走。

## 目标

在项目根执行：

```powershell
npm run e2blog -- create today
```

期望效果：

- 在 `src/content/blog/` 下新建 `today.md`
- 自动写入 frontmatter
- 文件已存在时报错退出，绝不覆盖
- 成功绿色、失败红色
- 不动全局环境

## 第一步：写一个 Node 脚本

在项目根建 `bin/e2blog.mjs`。用 `.mjs` 后缀，不管 `package.json` 有没有 `"type": "module"` 都能直接跑。

核心逻辑只有四件事：解析参数、定位目录、检查冲突、写文件。

```javascript
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const useColor =
  process.stdout.isTTY &&
  !process.env.NO_COLOR &&
  process.env.TERM !== 'dumb';
const green = (s) => (useColor ? `\x1b[32m${s}\x1b[0m` : s);
const red   = (s) => (useColor ? `\x1b[31m${s}\x1b[0m` : s);

const fail = (msg) => {
  console.error(red(`✖ ${msg}`));
  process.exit(1);
};

// npm run e2blog -- create today
const [, , command, rawName] = process.argv;

if (command !== 'create') fail(`未知命令。用法: npm run e2blog -- create <文件名>`);
if (!rawName) fail('缺少文件名。');
if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(rawName) || rawName.includes('..')) {
  fail(`文件名不合法: "${rawName}"`);
}

// 用脚本自身位置推项目根，从任何子目录调用都正确
const scriptDir   = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const blogDir     = path.join(projectRoot, 'src', 'content', 'blog');
const filePath    = path.join(blogDir, `${rawName}.md`);
const relPath     = path.relative(projectRoot, filePath);

if (fs.existsSync(filePath)) fail(`文件已存在: ${relPath}`);

fs.mkdirSync(blogDir, { recursive: true });

const pad = (n) => String(n).padStart(2, '0');
const d = new Date();
const stamp =
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
  `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const content = `---
title: ${rawName}
pubDate: ${stamp}
description: 
tags: []
---

`;

try {
  // 'wx'：已存在就抛 EEXIST，兜底 existsSync 和写入之间的竞态
  fs.writeFileSync(filePath, content, { flag: 'wx' });
} catch (err) {
  if (err.code === 'EEXIST') fail(`文件已存在: ${relPath}`);
  fail(`写入失败: ${err.message}`);
}

console.log(green(`✔ 已创建 ${relPath}`));
```

## 第二步：挂到 npm scripts

`package.json` 里加一行即可：

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "e2blog": "node ./bin/e2blog.mjs"
  }
}
```

不要加 `bin` 字段，不需要 `npm link`，更不需要 `npm i -g`。命令的生命周期跟着 `package.json`，项目删了命令就没了。

## 三个容易踩的坑

**参数要加 `--`。** `npm run e2blog create today` 会把 `create today` 吞掉，必须写成 `npm run e2blog -- create today`，`--` 之后的参数才会原样传给脚本。

**别用 `process.cwd()` 定位目录。** 从子目录调用时 `cwd` 不对。用 `import.meta.url` 反推脚本位置，再往上找项目根，永远准确。

**`existsSync` 检查有竞态。** 检查通过到写入之间，文件可能被别人建出来。所以真正写入时用 `fs.writeFileSync(..., { flag: 'wx' })`，文件存在就抛 `EEXIST`，双保险。

## 颜色是怎么来的

PowerShell 5.1 起原生支持 ANSI 转义序列。`\x1b[32m` 是绿色、`\x1b[31m` 是红色、`\x1b[0m` 重置样式。Astro CLI 显示的彩色也是同一套原理，只是它用了 Chalk 之类的库封装。自己写几行字符串就够了，零依赖。

加 `process.stdout.isTTY` 判断是为了输出被重定向到文件时不写入乱码，再加 `NO_COLOR` 和 `TERM=dumb` 两个环境变量判断，照顾一些特殊终端。

## 关于 tags 的 YAML 空值

模板里 `tags: []` 是空数组。如果写成 `tags:` 下面跟一个 `- `，YAML 会把它解析成 `[null]`，而 Astro 的 content schema 通常是 `z.array(z.string())`，`null` 过不了校验，`astro build` 会直接报错。所以要么用 `[]`，要么用 `- ""`，别留裸的 `- `。

## 最终效果

```powershell
PS /e2/site> npm run e2blog -- create today
✔ 已创建 src\content\blog\today.md

PS /e2/site> npm run e2blog -- create today
✖ 文件已存在: src\content\blog\today.md
```

第一次绿色成功，第二次红色报错并以退出码 1 结束，可以放心接进任何 CI 或 hook 里。

整套东西加起来不到一百行，零第三方依赖，也完全不碰机器上的全局环境。
