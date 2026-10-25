import type { SitemapOptions } from '@astrojs/sitemap';

/**
 * Sitemap 配置：仅收录 /blog 及以下文章路由，其余页面一律排除。
 */
export const sitemapConfig: SitemapOptions = {
    filter: (page) => {
        const { pathname } = new URL(page);
        // 放行 /blog 本身与 /blog/ 开头的所有路径
        return pathname === '/blog' || pathname.startsWith('/blog/');
    },
};