// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

import { unified } from '@astrojs/markdown-remark';

import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';

/**
 * 把 :::tip / :::warning 这类 directive 转成带 class 的 div
 * @returns {(tree: import('mdast').Root) => void}
 */
function remarkContainers() {
  return (tree) => {
    visit(tree, 'containerDirective', (node) => {
      // mdast-util-directive 的静态类型里没有 hName / hProperties
      // 这两个属性由 mdast-util-to-hast 在运行时识别
      const n = /** @type {any} */ (node);
      n.data = n.data ?? {};
      n.data.hName = 'div';
      n.data.hProperties = {
        className: ['callout', `callout-${n.name}`],
      };
    });
  };
}

export default defineConfig({
  site: 'https://e-2.top',
  base: '/',

  integrations: [react(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },

  markdown: {
    // unified 管线：插件全部写在这一层
    processor: unified({
      remarkPlugins: [
        remarkGfm,
        remarkMath,
        remarkDirective,
        remarkContainers,
      ],
      rehypePlugins: [rehypeKatex],
    }),

    // Shiki 明暗双主题
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },

    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid'],
    },
  },
});