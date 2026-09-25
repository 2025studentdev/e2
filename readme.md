# e2 项目架构说明

## 目录结构

```
e2/
├── site/                    # Astro 主站
│   ├── src/
│   ├── public/
│   ├── astro.config.mjs
│   ├── package.json
│   └── package-lock.json
————————————

```

## 技术栈

| 组件 | 技术 |
|------|------|
| 主站框架 | Astro |
| 主站 UI 集成 | React (`@astrojs/react`) |
| 主站 CSS | Tailwind CSS v4 (`@tailwindcss/vite`) |
| CI/CD | Cloudflare Pages（Git 集成） |
| 运行时 | Node.js 24（由 `package.json` 的 `engines` 指定） |
| 托管 | Cloudflare Pages |
| 自定义域名 | `e-2.top` |
