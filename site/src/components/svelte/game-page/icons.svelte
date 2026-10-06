<script lang="ts">
  // 统一图标出口，使用方式：<Icon name="search" class="w-4 h-4" />
  export let name: 'search' | 'close' | 'arrow' | 'empty';

  // class 是 JS 保留字，不能直接作为变量名，用 className 接住再导出为 class
  let className: string = 'w-5 h-5';
  export { className as class };
</script>

{#if name === 'search'}
  <svg class={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
{:else if name === 'close'}
  <svg class={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
{:else if name === 'arrow'}
  <svg class={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
{:else if name === 'empty'}
  <svg class={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
    <path d="M8.5 11h5" />
  </svg>
{/if}