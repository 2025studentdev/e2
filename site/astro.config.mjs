// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import { sitemapConfig } from './src/config/sitemap-setting.ts';
import { codeSplittingConfig } from './src/config/chunk-big.ts';

import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';

/** @typedef {import('mdast').Root} MdastRoot */
/** @typedef {import('hast').Root} HastRoot */
/** @typedef {import('hast').Element} HastElement */
/** @typedef {import('hast').ElementContent} HastElementContent */
/** @typedef {import('hast').Text} HastText */

/**
 * 把 :::tip / :::warning 这类 directive 转成带 class 的 div
 * @returns {(tree: MdastRoot) => void}
 */
function remarkContainers() {
  return (tree) => {
    visit(tree, 'containerDirective', (/** @type {any} */ node) => {
      node.data = node.data ?? {};
      node.data.hName = 'div';
      node.data.hProperties = {
        className: ['callout', `callout-${node.name}`],
      };
    });
  };
}

/**
 * 判断节点是否已有指定 className
 * 用 unknown 接收，内部收窄，避免 Root | Element 与弱类型结构不兼容
 * @param {unknown} node
 * @param {string} cls
 */
function hasClass(node, cls) {
  if (!node || typeof node !== 'object') return false;
  const props = /** @type {{ properties?: { className?: unknown } }} */ (node).properties;
  const c = props?.className;
  return Array.isArray(c) ? c.includes(cls) : c === cls;
}

/**
 * 把 <pre> 包进 <div class="code-block">，让 Copy 按钮 absolute 定位不受横向滚动影响
 * @returns {(tree: HastRoot) => void}
 */
function rehypeWrapCodeBlock() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre') return;
      if (!parent || index == null) return;
      if (hasClass(parent, 'code-block')) return;

      /** @type {HastElement} */
      const wrapper = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-block'] },
        children: [node],
      };
      parent.children[index] = wrapper;
    });
  };
}

/**
 * 把只含单张 <img> 的 <p> 转成 <figure><img><figcaption>alt</figcaption></figure>
 * @returns {(tree: HastRoot) => void}
 */
function rehypeFigure() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'p') return;
      if (!parent || index == null) return;

      /** @type {HastElementContent[]} */
      const meaningful = node.children.filter(
          (c) => !(c.type === 'text' && !c.value.trim())
      );
      if (meaningful.length !== 1) return;

      const img = meaningful[0];
      if (img.type !== 'element' || img.tagName !== 'img') return;

      const alt = String(img.properties?.alt ?? '').trim();
      /** @type {HastElementContent[]} */
      const children = [img];

      if (alt) {
        /** @type {HastText} */
        const textNode = { type: 'text', value: alt };
        /** @type {HastElement} */
        const figcaption = {
          type: 'element',
          tagName: 'figcaption',
          properties: {},
          children: [textNode],
        };
        children.push(figcaption);
      }

      /** @type {HastElement} */
      const figure = {
        type: 'element',
        tagName: 'figure',
        properties: {},
        children,
      };
      parent.children[index] = figure;
    });
  };
}

/**
 * 把 <table> 包进 <div class="table-wrap">，纯 CSS 实现移动端横滚
 * @returns {(tree: HastRoot) => void}
 */
function rehypeWrapTable() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table') return;
      if (!parent || index == null) return;
      if (hasClass(parent, 'table-wrap')) return;

      /** @type {HastElement} */
      const wrapper = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-wrap'] },
        children: [node],
      };
      parent.children[index] = wrapper;
    });
  };
}

export default defineConfig({
  site: 'https://e-2.top',
  base: '/',

  integrations: [react(), sitemap(sitemapConfig), svelte()],

  vite: {
    plugins: [tailwindcss()],
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: codeSplittingConfig,
        },
      },
    },
  },

  markdown: {
    processor: unified({
      gfm: true,
      remarkPlugins: [remarkGfm, remarkMath, remarkDirective, remarkContainers],
      // 顺序很重要：rehypeKatex 先处理公式，再包结构
      rehypePlugins: [rehypeKatex, rehypeWrapCodeBlock, rehypeFigure, rehypeWrapTable],
    }),

    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      // 关键：取消内联颜色，完全交给 CSS 变量，让亮/暗色严格按规范色板走
      defaultColor: false,
    },

    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid'],
    },
  },
});