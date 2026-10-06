<script lang="ts">
  import type { GameEntry } from './games';
  import GameCard from './GameCard.svelte';
  import Icon from './icons.svelte';

  export let games: GameEntry[];

  let query = '';

  $: keyword = query.trim().toLowerCase();
  $: filtered = keyword
    ? games.filter((g) =>
        [g.name, g.description, g.slug].join(' ').toLowerCase().includes(keyword)
      )
    : games;
</script>

<div class="space-y-8">
  <!-- 搜索框 -->
  <div class="relative max-w-xs">
    <span
      class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2
             text-slate-400 dark:text-slate-500"
    >
      <Icon name="search" class="h-4 w-4" />
    </span>

    <input
      bind:value={query}
      type="text"
      placeholder="搜索游戏"
      aria-label="搜索游戏"
      class="w-full rounded-md border border-slate-200 bg-white py-2.5
             pl-10 pr-9 text-sm text-slate-900
             placeholder:text-slate-400
             transition-colors duration-150
             focus:border-slate-900 focus:outline-none
             dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100
             dark:placeholder:text-slate-500 dark:focus:border-slate-100"
    />

    {#if query}
      <button
        type="button"
        on:click={() => (query = '')}
        aria-label="清空搜索"
        class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1
               text-slate-400 transition-colors duration-150
               hover:text-slate-900 dark:hover:text-slate-100"
      >
        <Icon name="close" class="h-3.5 w-3.5" />
      </button>
    {/if}
  </div>

  <!-- 结果 -->
  {#if filtered.length > 0}
    <div
      class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {#each filtered as game, i (game.slug)}
        <GameCard {game} index={i} />
      {/each}
    </div>
  {:else}
    <!-- 空状态 -->
    <div
      class="flex flex-col items-center justify-center gap-4 rounded-lg
             border border-dashed border-slate-200 py-20
             dark:border-slate-800"
    >
      <Icon name="empty" class="h-7 w-7 text-slate-300 dark:text-slate-700" />
      <p class="text-sm text-slate-400 dark:text-slate-500">
        没有匹配「{query}」的游戏
      </p>
      <button
        type="button"
        on:click={() => (query = '')}
        class="text-xs font-medium text-slate-900 underline underline-offset-4
               transition hover:no-underline dark:text-slate-100"
      >
        清空搜索
      </button>
    </div>
  {/if}
</div>