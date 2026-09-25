---
title: "从零开始搭建博客"
description: "使用 Astro，从零开始搭建博客"
pubDate: 2026-09-25T15:30:00
tags: ["Astro", "博客"]
draft: false
---
# 使用 Astro，从零开始搭建博客

Astro 7 在 2026 年发布后，构建速度有了质的飞跃。我决定用它和 Tailwind CSS 4 重新搭建自己的博客。这篇文章记录了我从零开始搭建的过程，包括内容集合、分页、RSS、创建文章的脚本，以及途中踩过的坑。如果你也想用 Astro 7 搭建博客，希望这篇教程能帮你少走弯路。

## 1. 初始化项目与 Tailwind CSS 4

首先创建 Astro 项目：

```bash
npm create astro@latest my-blog
cd my-blog
```

然后添加 Tailwind CSS 4。注意，Astro 7 不再使用 `@astrojs/tailwind` 集成，而是通过官方的 Vite 插件 `@tailwindcss/vite`：

```bash
npm install tailwindcss @tailwindcss/vite
```

在 `astro.config.mjs` 中配置：

```javascript
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://your-domain.com',
  vite: {
    plugins: [tailwindcss()],
  },
});
```

Tailwind CSS 4 采用 CSS-first 配置，所有设计令牌写在 `global.css` 的 `@theme` 块中。为了方便在 `@apply` 中访问自定义颜色，我把主题定义抽到了单独的 `theme.css`：

```css
/* src/assets/styles/theme.css */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-brand-400: oklch(0.70 0.16 250);
  --color-brand-500: oklch(0.62 0.19 250);
  --color-brand-600: oklch(0.55 0.22 250);
  --font-sans: "Inter", system-ui, sans-serif;
}
```

然后在 `global.css` 中引用它，并编写全局样式：

```css
/* src/assets/styles/global.css */
@import "tailwindcss";
@reference "./theme.css";

body {
  @apply bg-white text-gray-900 antialiased;
  @variant dark {
    @apply bg-gray-950 text-gray-100;
  }
  font-family: var(--font-sans);
}

.prose a {
  @apply text-brand-600 underline underline-offset-4;
  @variant dark {
    @apply text-brand-400;
  }
}
```

> **踩坑提醒**：Tailwind CSS 4 的 `@apply` 不支持 `dark:` 这类变体前缀，必须用 `@variant dark { ... }` 块。另外，`@reference` 不能引用自身，否则会触发递归错误。

## 2. 定义内容集合与 Front Matter

Astro 的内容集合（Content Collections）用 Zod 定义 Front Matter 格式，保证类型安全。创建 `src/content.config.ts`：

```typescript
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

`z.coerce.date()` 能自动把 `"2026-09-25"` 这样的字符串转为 `Date` 对象。之后写文章时，Front Matter 只需要填 `title` 和 `pubDate` 即可，其他字段都有默认值或可选。

## 3. 博客列表与分页

分页我放弃了 Astro 内置的 `paginate()`，因为它生成的是 `/blog/2` 这种扁平 URL。我更希望得到 `/blog/page/2` 这样语义清晰的地址。于是拆成两个路由文件。

**第 1 页** `src/pages/blog/index.astro`：

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import BlogGrid from '../../components/BlogGrid.astro';

const PAGE_SIZE = 9;
const allPosts = (await getCollection('blog'))
  .filter((post) => !post.data.draft)
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

const totalPages = Math.ceil(allPosts.length / PAGE_SIZE);
const posts = allPosts.slice(0, PAGE_SIZE);
---

<BaseLayout title="博客">
  <section class="max-w-4xl mx-auto px-4 py-12">
    <h1 class="text-3xl font-bold mb-8">博客</h1>
    <BlogGrid
      posts={posts}
      currentPage={1}
      totalPages={totalPages}
      prevUrl={null}
      nextUrl={totalPages > 1 ? '/blog/page/2' : null}
    />
  </section>
</BaseLayout>
```

**第 2 页及以后** `src/pages/blog/page/[page].astro`：

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import BlogGrid from '../../../components/BlogGrid.astro';

const PAGE_SIZE = 9;

export async function getStaticPaths() {
  const allPosts = (await getCollection('blog'))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  const totalPages = Math.ceil(allPosts.length / PAGE_SIZE);
  return Array.from({ length: totalPages - 1 }, (_, i) => ({
    params: { page: String(i + 2) },
  }));
}

const currentPage = Number(Astro.params.page);
// ... 获取当前页文章，计算 prevUrl / nextUrl
---
```

分页控件和文章列表封装在 `BlogGrid.astro` 和 `Pagination.astro` 中，逻辑清晰且可复用。

## 4. 文章详情页

详情页使用动态路由 `src/pages/blog/[...slug].astro`。注意 Astro 7 中 `post.render()` 已被移除，需要导入 `render` 函数：

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id.replace(/\.mdx?$/, '') },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---

<BaseLayout title={post.data.title}>
  <article class="max-w-3xl mx-auto px-4 py-12">
    <h1 class="text-3xl font-bold mb-3">{post.data.title}</h1>
    <time datetime={post.data.pubDate.toISOString()}>
      {post.data.pubDate.toLocaleDateString('zh-CN', {
        year: 'numeric', month: 'long', day: 'numeric',
      })}
    </time>
    <div class="prose mt-8">
      <Content />
    </div>
  </article>
</BaseLayout>
```

URL 直接用文件名（`post.id`）生成。`post.id` 是相对于 `src/content/blog/` 的路径，不含扩展名。`replace(/\.mdx?$/, '')` 是防御性写法，兼容 `.md` 和 `.mdx`。

## 5. 添加 RSS 订阅

安装官方包：

```bash
npm install @astrojs/rss
```

创建 `src/pages/rss.xml.ts`：

```typescript
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog'))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: 'My Astro Blog',
    description: '使用 Astro 7 和 Tailwind CSS 4 构建的博客',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description ?? '',
      pubDate: post.data.pubDate,
      link: `/blog/${post.id.replace(/\.mdx?$/, '')}/`,
    })),
    customData: `<language>zh-CN</language>`,
  });
}
```

最后在 `BaseLayout.astro` 的 `<head>` 里加上自动发现链接：

```astro
<link rel="alternate" type="application/rss+xml" title="My Astro Blog" href={new URL('rss.xml', Astro.site)} />
```

## 6. 创建新文章的脚本

Hexo 有 `hexo new`，Astro 没有内置。我写了一个简单的 Node.js 脚本 `scripts/new-post.js`：

```javascript
import fs from "fs";
import path from "path";

const title = process.argv[2];
if (!title) {
  console.error("❌ 请提供文章标题，例如: npm run new \"我的第一篇文章\"");
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
  .replace(/^-|-$/g, "");

const date = new Date().toISOString().split("T")[0];
const contentDir = path.resolve(process.cwd(), "src/content/blog");
const filePath = path.join(contentDir, `${slug}.md`);

const content = `---
title: "${title}"
description: ""
pubDate: ${date}
tags: []
draft: true
---

在这里开始写你的文章...
`;

if (fs.existsSync(filePath)) {
  console.error(`❌ 文件已存在: ${filePath}`);
  process.exit(1);
}

fs.writeFileSync(filePath, content);
console.log(`✅ 已创建: ${path.relative(process.cwd(), filePath)}`);
```

在 `package.json` 中添加：

```json
"scripts": {
  "new": "node scripts/new-post.js"
}
```

之后就可以用 `npm run new "标题"` 创建新文章了。

## 7. UI 优化建议

基础功能完成后，可以进一步优化阅读体验：

- **使用 `@tailwindcss/typography` 插件**：为 Markdown 内容提供优雅的默认排版。
- **添加文章目录（TOC）**：长文章可生成浮动目录，提升导航体验。
- **微妙的动画**：利用 Tailwind 的 `starting` 变体让列表项渐入。
- **优化卡片设计**：为文章卡片增加阴影和 hover 效果，增强层次感。

## 8. 常见问题与踩坑记录

- **`@apply` 不支持变体前缀**：必须用 `@variant dark { ... }`。
- **`@reference` 不能引用自身**：会触发递归错误，应把主题定义抽到单独文件。
- **`post.render()` 已移除**：改用 `import { render } from 'astro:content'` 和 `render(post)`。
- **`post.slug` 不存在**：Content Layer API 中请使用 `post.id`。
- **同一天发多篇文章**：`pubDate` 加上具体时间可避免排序不稳定。

## 总结

Astro 7 + Tailwind CSS 4 的组合让搭建博客变得非常高效。内容集合提供了类型安全的 Front Matter，手动分页让 URL 更友好，RSS 和创建脚本进一步提升了写作体验。整个过程踩了一些坑，但解决方案都不复杂。希望这篇文章能帮你顺利搭建自己的 Astro 博客。