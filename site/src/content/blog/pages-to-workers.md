---
title: 我为什么要将博客迁到 Cloudflare Workers？
pubDate: 2026-10-05T18:30:00
description: 记录我从 Cloudflare Pages 迁移到 Cloudflare Workers 的原因：静态资源请求不计入 10 万次额度，并且能使用最新版本能力。
tags:
  - Cloudflare
  - Workers
  - 迁移
---

## 从 Cloudflare Pages 迁移到 Workers 的考虑

我使用 Cloudflare Pages 托管静态站点已有一段时间。Pages 提供了便捷的 Git 集成、自动构建和全球 CDN，对于个人项目而言是可靠的选择。但近期我将站点迁移到了 Cloudflare Workers，主要基于两个技术层面的原因：静态资源请求不计入请求配额，以及对最新运行时特性的支持更为及时。

### 静态资源请求不计入请求配额

Cloudflare Workers 免费计划每天提供 100,000 次请求。这一配额通常针对 Worker 脚本的执行次数。然而，当使用 Workers 的静态资源（Assets）功能时，通过 Assets 绑定提供的文件请求并不计入这 100,000 次配额。只有实际调用 Worker 脚本的请求才会被计数。

对于以静态内容为主的站点，这意味着页面、样式表、脚本、图片等资源的加载不会消耗每日请求额度。只有动态逻辑（如 API 调用、表单处理）才会计入。这种计费方式使得 Workers 在托管静态站点时具有明显的成本优势。

相比之下，Cloudflare Pages 虽然也提供静态资源托管，但其 Functions 的请求会计入相应的配额。当站点同时包含静态资源和少量动态功能时，Workers 的模型更为清晰，也更容易控制用量。

### 更及时的最新版本支持

Cloudflare Workers 是 Cloudflare 无服务器平台的核心产品，新的运行时特性、兼容性日期（compatibility date）和兼容性标志（compatibility flags）通常首先在 Workers 上提供。通过 `wrangler.toml`，我可以直接指定最新的 `compatibility_date`，从而使用最新的 JavaScript 语言特性、Node.js API 兼容层以及性能改进。

Pages Functions 虽然底层同样运行在 Workers 运行时之上，但其配置和版本更新往往需要经过 Pages 团队的适配，因此在特性支持上可能存在延迟。对于需要及时使用新功能的项目，直接使用 Workers 可以减少等待时间。

### 其他技术考量

除了上述两点，Workers 还提供了一些额外的便利：

- **统一的配置模型**：静态资源和动态逻辑在同一个 Worker 中管理，路由和中间件配置更为灵活。
- **本地开发体验**：`wrangler dev` 可以完整模拟 Workers 运行时，便于调试。
- **路由控制**：Workers 支持更细粒度的路由规则，便于实现重定向、边缘逻辑等。

### 迁移过程

迁移过程并不复杂。将静态文件放置于 `public` 或 `assets` 目录，在 `wrangler.toml` 中配置 `assets` 绑定，并编写一个简单的 Worker 脚本处理动态请求，其余请求交由静态资源处理。通过 `wrangler deploy` 即可完成部署。迁移后，站点的访问速度和缓存行为与 Pages 基本一致。

### 总结

将站点从 Cloudflare Pages 迁移到 Workers，主要是基于请求配额和版本支持两方面的考虑。静态资源请求不计入每日 100,000 次配额，降低了流量波动带来的成本风险；而 Workers 对最新运行时特性的及时支持，则满足了使用新功能的需求。对于以静态内容为主、同时需要一定动态能力的站点，Workers 是一个值得考虑的方案。