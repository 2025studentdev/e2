#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------- 颜色（ANSI 转义序列，PowerShell 5.1+/7+ 原生支持） ----------
const useColor =
    process.stdout.isTTY &&
    !process.env.NO_COLOR &&
    process.env.TERM !== 'dumb';
const green = (s) => (useColor ? `\x1b[32m${s}\x1b[0m` : s);
const red   = (s) => (useColor ? `\x1b[31m${s}\x1b[0m` : s);

function fail(msg) {
    console.error(red(`✖ ${msg}`));
    process.exit(1);
}

// ---------- 参数解析 ----------
// 调用: npm run e2blog -- create today
// process.argv: [node, e2blog.mjs, 'create', 'today']
const [, , command, rawName] = process.argv;

if (command !== 'create') {
    fail(`未知命令 "${command ?? ''}"。用法: npm run e2blog -- create <文件名>`);
}
if (!rawName) {
    fail('缺少文件名。用法: npm run e2blog -- create <文件名>');
}
// 白名单：只允许字母/数字开头，后接字母/数字/. _ -，并禁止 ..
// 这样天然杜绝 "../xxx" 路径穿越
if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(rawName) || rawName.includes('..')) {
    fail(`文件名不合法: "${rawName}"（只允许字母/数字/. _ -，且不能含 ..）`);
}

// ---------- 定位项目根（用脚本自身位置推导，不依赖 cwd） ----------
const scriptDir   = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');

const blogDir  = path.join(projectRoot, 'src', 'content', 'blog');
const fileName = `${rawName}.md`;
const filePath = path.join(blogDir, fileName);
const relPath  = path.relative(projectRoot, filePath);

// ---------- 冲突检查（先给友好提示） ----------
if (fs.existsSync(filePath)) {
    fail(`文件已存在，拒绝覆盖: ${relPath}`);
}

// ---------- 本地时间，格式 2026-10-26T15:00:00 ----------
const pad = (n) => String(n).padStart(2, '0');
function localDateTime(d = new Date()) {
    return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
        `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    );
}

// ---------- 生成内容（严格仿照给定 frontmatter） ----------
fs.mkdirSync(blogDir, { recursive: true });

// 注意：tags 下的 "- " 会被 YAML 解析为 [null]。
// 若 src/content/config.ts 是 z.array(z.string())，请改成 "tags: []" 或 '- ""'。
const content = `---
title: ${rawName}
pubDate: ${localDateTime()}
description: 
tags:
- 
---

`;

try {
    // 'wx'：文件已存在就抛 EEXIST，兜底 existsSync 与写入之间的竞态
    fs.writeFileSync(filePath, content, { flag: 'wx' });
} catch (err) {
    if (err.code === 'EEXIST') {
        fail(`文件已存在，拒绝覆盖: ${relPath}`);
    }
    fail(`写入失败: ${err.message}`);
}

console.log(green(`✔ 已创建 ${relPath}`));