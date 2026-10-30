<!--
  /src/components/index-v2-svelte/Home.svelte
  主内容：Intro + 四个入口（Bento 2×2）+ 三句语录。
  纯静态，不 hydrate，Astro 直接 SSR 输出 HTML。
  样式全部 scoped，只依赖 index-v2.css 暴露的 token。
-->
<script lang="ts">
  type LinkItem = {
    href: string;
    zh: string;
    en: string;
    desc: string;
    /** 静态 SVG 片段；渲染端用 {@html} 注入，禁止接入用户输入 */
    icon: string;
  };

  type QuoteItem = {
    index: string;
    text: string;
    note: string;
  };

  const links: readonly LinkItem[] = [
    {
      href: '/games',
      zh: '小游戏',
      en: 'GAMES',
      desc: '把想法做成能玩的东西。这里放着我用碎片时间拼出来的小实验，欢迎试玩。',
      icon: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    },
    {
      href: '/blog',
      zh: '博客',
      en: 'BLOG',
      desc: '把踩过的坑、读过的源码、想明白的事，一条条写下来。',
      icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/>',
    },
    {
      href: '/docs',
      zh: '文档',
      en: 'DOCS',
      desc: '笔记与速查手册。',
      icon: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    },
    {
      href: '/about',
      zh: '关于',
      en: 'ABOUT',
      desc: '这里是谁、在做什么、以及怎么找到我。如果你也想聊聊技术以外的事——比如最近在读什么书、听了什么歌，这里是最好的入口。',
      icon: '<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    },
  ];

  const quotes: readonly QuoteItem[] = [
    {
      index: '01',
      text: '学最好的别人，做最好的自己。',
      note: '所以，先抄，再改，最后扔掉。别人的解法只是起点，终点得自己走。',
    },
    {
      index: '02',
      text: '慢一点，做透一点。',
      note: '比起铺开十件事，不如把一件做到能在深夜里安心睡着。',
    },
    {
      index: '03',
      text: '把复杂拆开，把简单做好。',
      note: '大部分难题，都是几个简单问题的串联。拆得越细，越不容易迷路。',
    },
  ];
</script>

<!-- ============ 01 介绍 ============ -->
<section class="section intro" aria-labelledby="intro-title">
  <div class="wrap">
    <p class="eyebrow" data-reveal>
      <span class="eyebrow__no">01</span>
      Introduction · 这里是什么
    </p>
    <h2 id="intro-title" class="sr-only">介绍</h2>
    <p class="intro__lead" data-reveal style="--reveal-delay: 100ms">
      一个写代码的人，一些没写完的想法，一处被访问到的角落。
    </p>
    <p class="intro__body" data-reveal style="--reveal-delay: 200ms">
      不止是完成任务，更是解决问题。<br />
      不满足于做完，执着于做好。
    </p>
  </div>
</section>

<!-- ============ 02 四个入口（Bento 2×2） ============ -->
<section class="section" id="entries" aria-labelledby="entries-title">
  <div class="wrap">
    <p class="eyebrow" data-reveal>
      <span class="eyebrow__no">02</span>
      Explore · 从这里开始
    </p>
    <h2 id="entries-title" class="section__title" data-reveal style="--reveal-delay: 80ms">
      四个入口
    </h2>
    <p class="section__lead" data-reveal style="--reveal-delay: 160ms">
      站点不大，但每一个角落都被认真对待过。挑一个你感兴趣的，慢慢逛。
    </p>

    <div class="entries">
      {#each links as { href, zh, en, desc, icon }, i}
        <a
          class="entry"
          href={href}
          data-reveal
          style={`--reveal-delay: ${i * 90}ms`}
        >
          <div class="entry__head">
            <span class="entry__icon" aria-hidden="true">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                {@html icon}
              </svg>
            </span>
            <span class="entry__no" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
          </div>

          <div class="entry__body">
            <h3 class="entry__zh">{zh}</h3>
            <span class="entry__en">{en}</span>
            <p class="entry__desc">{desc}</p>
          </div>

          <span class="entry__arrow" aria-hidden="true">↗</span>
        </a>
      {/each}
    </div>
  </div>
</section>

<!-- ============ 03 三句话 ============ -->
<section class="section" id="quotes" aria-labelledby="quotes-title">
  <div class="wrap">
    <p class="eyebrow" data-reveal>
      <span class="eyebrow__no">03</span>
      Principles · 一点执念
    </p>
    <h2 id="quotes-title" class="section__title" data-reveal style="--reveal-delay: 80ms">
      写给自己的三句话
    </h2>
    <p class="section__lead" data-reveal style="--reveal-delay: 160ms">
      它们被我贴在显示器边上，也贴在每一次提交之前。
    </p>

    <div class="quotes">
      {#each quotes as q, i}
        <div class="quote" data-reveal style={`--reveal-delay: ${i * 100}ms`}>
          <div class="quote__head">
            <span class="quote__no">/ {q.index}</span>
            <span class="quote__line" aria-hidden="true"></span>
          </div>
          <p class="quote__text">{q.text}</p>
          <p class="quote__note">{q.note}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  /* ============================================================
     Home 的 scoped 样式。
     Token 全部来自 index-v2.css：--bg / --ink / --ink-dim /
     --ink-mute / --ink-faint / --line / --line-strong / --line-hover
     ============================================================ */

  /* ---------- 01 介绍 ---------- */
  .intro {
    min-height: 70vh;
    display: flex;
    align-items: center;
  }
  .intro__lead {
    margin: 0;
    font-size: clamp(1.5rem, 3.6vw, 2.5rem);
    font-weight: 300;
    line-height: 1.5;
    letter-spacing: -0.005em;
    color: var(--ink);
    max-width: 30ch;
  }
  .intro__body {
    margin: 2rem 0 0;
    max-width: 48ch;
    font-size: 0.9375rem;
    line-height: 2.1;
    color: var(--ink-dim);
  }

  /* ---------- 02 入口：Bento 2×2 ---------- */
  .entries {
    margin-top: 4rem;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .entry {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-height: 15rem;
    padding: 1.75rem;
    text-decoration: none;
    color: inherit;
    border: 1px solid var(--line);
    border-radius: 1.25rem;
    background: rgba(237, 234, 227, 0.03);
    isolation: isolate;
    transition:
      transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
      border-color 0.3s ease,
      background-color 0.3s ease,
      box-shadow 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .entry:hover {
    transform: translateY(-4px);
    border-color: var(--line-hover);
    background: rgba(237, 234, 227, 0.055);
    box-shadow: 0 20px 44px -28px rgba(237, 234, 227, 0.28);
  }
  .entry:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 4px;
    border-radius: 1.25rem;
  }

  .entry__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .entry__icon {
    display: inline-flex;
    width: 3rem;
    height: 3rem;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    background: rgba(237, 234, 227, 0.06);
    color: var(--ink);
    transition:
      background-color 0.35s ease,
      color 0.35s ease,
      transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .entry:hover .entry__icon {
    background: var(--ink);
    color: var(--bg);
    transform: rotate(-8deg) scale(1.08);
  }
  .entry__no {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.32em;
    color: var(--ink-mute);
    font-variant-numeric: tabular-nums;
    transition: color 0.3s ease;
  }
  .entry:hover .entry__no {
    color: var(--ink-dim);
  }

  .entry__body {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex: 1;
  }
  .entry__zh {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    color: var(--ink);
    line-height: 1.1;
  }
  .entry__en {
    font-size: 0.6875rem;
    letter-spacing: 0.32em;
    color: var(--ink-mute);
  }
  .entry__desc {
    margin: 0.85rem 0 0;
    font-size: 0.875rem;
    line-height: 1.85;
    color: rgba(237, 234, 227, 0.55);
    transition: color 0.3s ease;
  }
  .entry:hover .entry__desc {
    color: rgba(237, 234, 227, 0.82);
  }

  .entry__arrow {
    position: absolute;
    right: 1.5rem;
    bottom: 1.5rem;
    font-size: 1.25rem;
    line-height: 1;
    color: var(--ink-mute);
    transition:
      transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
      color 0.3s ease;
  }
  .entry:hover .entry__arrow {
    transform: translate(3px, -3px);
    color: var(--ink);
  }

  /* ---------- 03 语录：纵向堆叠大字 ---------- */
  .quotes {
    margin-top: 4rem;
    display: flex;
    flex-direction: column;
  }

  .quote {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-block: clamp(2rem, 4.5vw, 3.25rem);
  }
  .quote + .quote {
    border-top: 1px solid var(--line);
  }

  .quote__head {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .quote__no {
    font-size: 0.6875rem;
    letter-spacing: 0.4em;
    color: var(--ink-mute);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .quote__line {
    flex: 1;
    height: 1px;
    background: var(--line);
    transition: background-color 0.4s ease;
  }
  .quote:hover .quote__line {
    background: var(--line-hover);
  }

  .quote__text {
    margin: 0;
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    font-weight: 300;
    line-height: 1.4;
    letter-spacing: -0.005em;
    color: var(--ink);
    max-width: 32ch;
    transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .quote:hover .quote__text {
    transform: translateX(0.5rem);
  }

  .quote__note {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.9;
    color: rgba(237, 234, 227, 0.5);
    max-width: 56ch;
    transition: color 0.4s ease;
  }
  .quote:hover .quote__note {
    color: rgba(237, 234, 227, 0.7);
  }

  /* ---------- 响应式：小屏单列 ---------- */
  @media (max-width: 720px) {
    .entries {
      grid-template-columns: 1fr;
      margin-top: 3rem;
    }
    .entry {
      min-height: 0;
      padding: 1.5rem;
    }
    .entry__zh {
      font-size: 1.375rem;
    }
  }

  /* ---------- 减少动效 ---------- */
  @media (prefers-reduced-motion: reduce) {
    .entry,
    .entry__icon,
    .entry__no,
    .entry__desc,
    .entry__arrow,
    .quote__line,
    .quote__text,
    .quote__note {
      transition: none;
    }
    .entry:hover {
      transform: none;
    }
    .entry:hover .entry__icon {
      transform: none;
    }
    .entry:hover .entry__arrow {
      transform: none;
    }
    .quote:hover .quote__text {
      transform: none;
    }
  }
</style>