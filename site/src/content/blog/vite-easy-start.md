---
title: Vite 入门：从原理到踩坑的一次完整记录
pubDate: 2026-11-21T21:09:52
description: 先讲清 Vite 的开发与构建两套机制，再动手做一个 ASCII 字符画生成器，记录打包产物缺失 JS、样式解析失败等报错，最后给出排查思路与避坑清单。
tags:
- Vite
- 前端工程化
- JavaScript
- 构建工具
---
## 一、先讲 Vite：它到底怎么工作

Vite 是一个前端构建工具，名字来自法语“快”。它快，不是因为做了什么神奇的优化，而是因为在开发和生产两个阶段，它走的是**两套完全不同的机制**。

**开发阶段：不打包。** 浏览器原生支持 ES Module，Vite 就顺着这个能力做：启动一个 dev server，页面请求哪个模块，它就即时编译哪个模块返回。没有把整个项目捆成一个 bundle 的过程，所以冷启动时间与项目规模基本无关，改一个文件也只影响那一个模块的请求。

**生产阶段：完整打包。** `vite build` 用 Rollup 把模块图整体分析一遍，做 Tree-shaking、代码分割、压缩，产出带 hash 的静态文件，交给任意静态服务器托管。

理解“两套机制”这一点非常关键，因为后面所有的坑，本质都源于**dev 的宽容和 build 的严格不是同一套规则**。

在默认约定下，Vite 有几个硬性前提：

- `index.html` 放在**项目根目录**，它被当作构建入口解析，而不是当作普通静态文件拷贝；
- 只有 `<script type="module" src="...">` 会被纳入模块图，参与打包；
- `public/` 目录里的内容原样拷贝到产物根目录，不参与编译和 hash；
- `node_modules` 不是被拷贝的目录，任何指向它的静态引用在产物里都不存在。

## 二、尝试：做一个 ASCII 字符画生成器

需求很简单：上传图片，转成可复制的 ASCII 字符画。纯静态页面，无框架、无路由，正好用来验证 Vite 的“零配置”。

依赖选了 Pico CSS 做样式，`img2asciix` 做图片转字符。计划的结构：

```
ascii-generator/
├─ index.html
├─ package.json
└─ src/
   ├─ main.js
   └─ styles/
      └─ main.css
```

`package.json`：

```json
{
  "name": "ascii-generator",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "@picocss/pico": "^2.1.1",
    "img2asciix": "^2.0.0"
  },
  "devDependencies": {
    "vite": "^8.3.8"
  }
}
```

最初的 `index.html` 是照着传统写法写的：样式用 `<link>` 引，转换库用 `<script src>` 引，业务逻辑直接内联在页面底部。

```html
<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ASCII 字符画生成器</title>
    <link rel="stylesheet" href="./node_modules/@picocss/pico/css/pico.min.css">
    <style>
        :root {
            color-scheme: light only;
            --page-bg: #f5f7fa;
            --card-bg: #ffffff;
            --border: #d9dee7;
            --text-main: #1f2937;
            --text-muted: #6b7280;
            --accent: #2563eb;
        }
        body { margin: 0; background: var(--page-bg); color: var(--text-main); }
        main.container { max-width: 960px; padding: 2rem 1rem 3rem; }
        #ascii-output {
            font-family: "Courier New", Courier, monospace;
            font-size: 10px;
            line-height: 1.05;
            white-space: pre;
            overflow: auto;
            max-height: 70vh;
        }
    </style>
</head>
<body>
<main class="container">
    <header class="page-header">
        <h1>ASCII 字符画生成器</h1>
        <p>上传图片后，将图片转换为可复制的 ASCII 字符画。</p>
    </header>

    <article>
        <label for="image-input">上传图片</label>
        <input type="file" id="image-input" accept="image/*">
        <label for="width-slider">输出宽度</label>
        <input type="range" id="width-slider" min="40" max="200" value="100">
    </article>

    <article>
        <button class="copy-btn" id="copy-btn" disabled>复制字符画</button>
        <pre id="ascii-output">等待上传图片...</pre>
    </article>
</main>

<script src="./node_modules/img2asciix/dist/img2asciix.bundle.js"></script>
<script>
    const input = document.getElementById('image-input');
    const slider = document.getElementById('width-slider');
    const output = document.getElementById('ascii-output');
    const copyBtn = document.getElementById('copy-btn');
    const ASCII_RAMP = '@W#%*=+~-:. ';
    let currentAscii = '';

    slider.addEventListener('input', () => {
        document.getElementById('width-value').textContent = slider.value;
        if (input.files[0]) convertImage();
    });

    input.addEventListener('change', async () => {
        if (!input.files[0]) return;
        await convertImage();
    });

    async function convertImage() {
        const url = URL.createObjectURL(input.files[0]);
        try {
            currentAscii = await AsciiArt.convert(url, {
                width: parseInt(slider.value),
                asciiRamp: ASCII_RAMP
            });
            output.textContent = currentAscii;
            copyBtn.disabled = false;
        } catch (err) {
            output.textContent = '转换失败：' + err.message;
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    copyBtn.addEventListener('click', async () => {
        await navigator.clipboard.writeText(currentAscii);
    });
</script>
</body>
</html>
```

`npm run dev` 一跑，页面正常：图片能上传，字符画能出来，复制也能用。看起来一切完美，于是直接执行 `npm run build`。

## 三、失败：两次报错，一次静默

### 失败一：产物里没有 JS

`dist` 目录打开一看，只有一个 `index.html`，没有 `assets/`，没有任何 `.js` 文件。

更诡异的是，构建过程**没有报错**，只是安静地成功了。翻构建日志，才在中间找到一行不起眼的警告：

```
<script src="./node_modules/img2asciix/dist/img2asciix.bundle.js"> in "/index.html"
can't be bundled without type="module" attribute
```

### 失败二：改结构后样式解析失败

按“把逻辑拆到 `src/main.js`”的思路重构，`index.html` 改成：

```html
<script type="module" src="/src/main.js"></script>
```

`src/main.js` 顶部写：

```js
import '@picocss/pico/css/pico.min.css'
import './styles/main.css'
import * as img2asciix from 'img2asciix'
```

dev server 立刻弹出错误覆盖层：

```
[plugin:vite:import-analysis] Failed to resolve import "./styles/main.css" from "src/main.js". Does the file exist?
D:/WebProj/ascii-generator/src/main.js:2:8
1  |  import '@picocss/pico/css/pico.min.css'
2  |  import './styles/main.css'
   |          ^
```

### 失败三：`file://` 打开产物白屏

顺手用浏览器直接双击打开 `dist/index.html`，页面白屏，Console 报模块加载失败。当时以为是打包坏了，其实是验证方式不对。

## 四、排查：把三个现象归到三条规则上

### 排查一：为什么 JS 没被打包

回到第一节那条约定：**只有 `type="module"` 的脚本才进模块图。**

原来的写法是普通 `<script src="./node_modules/...">`，于是：

1. dev 时能跑，是因为 dev server 会按路径把 `node_modules` 里的文件原样返回，属于“看起来正常”的假象；
2. build 时 Vite 直接跳过这条脚本，只给警告不报错，所以构建“成功”；
3. `node_modules` 又不是被静态拷贝的目录，产物里自然没有这个文件，线上必然 404。

内联的那段业务逻辑同理：它是普通 `<script>`，不会被抽成独立 chunk，而是原样留在 `dist/index.html` 里。所以“只有一个 HTML”是这两件事叠加的必然结果——不是打包丢了文件，是压根没有文件可产。

修正后的入口：

```html
<script type="module" src="/src/main.js"></script>
```

```js
// src/main.js
import '@picocss/pico/css/pico.min.css'
import './styles/main.css'
import * as img2asciix from 'img2asciix'

// 兼容 ESM default 导出 / 具名导出 / UMD 全局变量三种形态
const AsciiArt = img2asciix.default ?? img2asciix.AsciiArt ?? globalThis.AsciiArt

const ASCII_RAMP = '@W#%*=+~-:. '
const els = {
    input: document.getElementById('image-input'),
    slider: document.getElementById('width-slider'),
    output: document.getElementById('ascii-output'),
    copyBtn: document.getElementById('copy-btn')
}
let currentAscii = ''

els.slider.addEventListener('input', () => {
    document.getElementById('width-value').textContent = els.slider.value
    if (els.input.files?.[0]) void convertImage()
})

els.input.addEventListener('change', () => {
    if (els.input.files?.[0]) void convertImage()
})

async function convertImage() {
    const url = URL.createObjectURL(els.input.files[0])
    try {
        currentAscii = await AsciiArt.convert(url, {
            width: Number.parseInt(els.slider.value, 10),
            asciiRamp: ASCII_RAMP
        })
        els.output.textContent = currentAscii
        els.copyBtn.disabled = false
    } catch (err) {
        els.output.textContent = '转换失败：' + (err?.message ?? err)
    } finally {
        URL.revokeObjectURL(url)
    }
}
```

顺带把 Pico 也改成 `import` 引入，删掉 `<link href="./node_modules/...">`——它属于同一类问题，只是样式丢了不容易第一时间察觉。

如果依赖只发布 UMD/IIFE 全局包、没有 ESM 入口，就不要硬塞进模块图：把 `img2asciix.bundle.js` 复制到 `public/vendor/`，在 module 脚本**之前**用 `<script src="/vendor/img2asciix.bundle.js"></script>` 引入，代码里取 `globalThis.AsciiArt`。`public/` 的引用必须是根绝对路径。

### 排查二：为什么样式解析失败

`Failed to resolve import` 这类报错，Vite 说得很直白：文件找不到。逐个核对：

- 相对路径是相对于**当前 JS 文件所在目录**的，`src/main.js` 里的 `./styles/main.css` 指向 `src/styles/main.css`；
- 实际当时 CSS 还留在 `index.html` 的 `<style>` 里，`src/styles/` 目录根本没建；
- 另外两个隐蔽可能：文件名大小写不一致（Windows 本地不区分，Linux 构建环境区分），或 Windows 隐藏扩展名导致实际存成了 `main.css.txt`。

把样式真正落成 `src/styles/main.css` 后，报错消失，产物里也出现了 `assets/index-xxx.css`。

### 排查三：为什么本地打开白屏

`dist/index.html` 里的资源是带 hash 的路径，ES Module 又受同源策略约束，用 `file://` 打开必然失败。正确验证方式是 `npx vite preview` 或任意 HTTP 服务器。这一步不算构建 bug，但很容易让人误判前面白折腾。

## 五、总结：一份可复用的避坑清单

把这次经历抽象出来，Vite 的坑基本集中在“入口约定”和“dev/build 差异”两处。

**约定类**

1. `index.html` 放项目根目录，它是构建入口，不是静态资源；
2. 只有 `type="module"` 的 `<script src>` 进模块图；内联脚本也要加 `type="module"` 才会被抽成 chunk；
3. 入口脚本用根绝对路径 `/src/main.js`，不要写 `./src/main.js`；
4. 样式用 `import` 引入，不要 `<link href="./node_modules/...">`；
5. `public/` 原样拷贝、不参与 hash，引用它必须用 `/xxx` 形式的绝对路径；
6. UMD/IIFE 全局包当静态资源处理，不要强行 `import`。

**差异类**

| 行为 | dev server | vite build |
| --- | --- | --- |
| 非 module 的 script src | 按路径原样返回 | 跳过并警告，产物缺失 |
| `node_modules` 直接引用 | 能访问 | 不拷贝，404 |
| 内联脚本 | 原样执行 | 非 module 不抽离 |

**习惯类**

- 改完入口、依赖、资源引用，固定跑一遍 `npm run build` + `npx vite preview`，别只信 `dev`；
- 构建日志里的警告要读，`can't be bundled without type="module"` 这类提示往往就是答案本身；
- 报 `Failed to resolve import` 先确认文件是否真实存在、路径大小写是否一致，而不是先怀疑 Vite；
- 永远不要用 `file://` 验证产物。

这次三个现象——产物没 JS、样式解析失败、本地白屏——分别对应“脚本没进模块图”“文件路径不存在”“验证方式不对”，没有一个是 Vite 本身的问题。它的“零配置”是有前提的：按它的约定写。前提满足了，配置几乎不用碰；前提违反了，它多半也只是警告一句，然后安静地给你一个不完整的产物。

