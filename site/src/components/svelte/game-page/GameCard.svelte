<script lang="ts">
  import type { GameEntry } from './games';
  import { gamePath } from './games';
  import Icon from './icons.svelte';

  export let game: GameEntry;
  export let index: number;
</script>

<a
  href={gamePath(game.slug)}
  class="group relative flex flex-col rounded-lg border border-slate-200 bg-white
         p-5 transition-all duration-200 ease-out
         hover:border-slate-900 hover:shadow-[0_2px_12px_rgba(15,23,42,0.06)]
         focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900
         focus-visible:ring-offset-2
         dark:border-slate-800 dark:bg-slate-900
         dark:hover:border-slate-100 dark:focus-visible:ring-slate-100
         dark:focus-visible:ring-offset-slate-950"
>
  <!-- 序号 -->
  <span
    class="mb-4 font-mono text-xs tabular-nums text-slate-300
           dark:text-slate-700"
  >
    {String(index + 1).padStart(2, '0')}
  </span>

  <h3
    class="text-[15px] font-semibold leading-tight tracking-tight text-slate-900
           dark:text-slate-50"
  >
    {game.name}
  </h3>

  <p
    class="mt-2 flex-1 text-[13px] leading-relaxed text-slate-500
           dark:text-slate-400"
  >
    {game.description}
  </p>

  <!-- 底部箭头 -->
  <div
    class="mt-6 flex items-center gap-1 text-slate-300 transition-colors
           duration-200 group-hover:text-slate-900
           dark:text-slate-700 dark:group-hover:text-slate-100"
  >
    <span class="text-xs font-medium tracking-wide">进入</span>
    <Icon
      name="arrow"
      class="h-3.5 w-3.5 transition-transform duration-200
             group-hover:translate-x-0.5"
    />
  </div>
</a>