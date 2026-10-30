// src/config/chunk-big.ts

/**
 * Rolldown 代码分割分组（Astro 7.4 / Vite 8）
 *
 * 核心策略：
 *  1. 大型库（React / Svelte / Three）用高 priority 单独聚合，便于长效缓存；
 *  2. Astro 内部运行时单独聚合，避免被其他 vendor 拆分干扰；
 *  3. 兜底 vendor 组只负责“接住”剩余模块，不设 maxSize，
 *     避免手动强拆触发执行顺序副作用（本次 Crypto 错误的根因）；
 *  4. 执行顺序安全交给 output.strictExecutionOrder: true 兜底。
 *
 * 优先级严格递减：35 → 30 → 25 → 20 → 5
 * 高优先级先匹配，模块一旦命中就不会进入后续分组。
 */

export const codeSplittingConfig = {
    groups: [
        // ── Astro 内部运行时（最高优先级，确保聚合）────────────────
        {
            name: 'vendor-astro-internal',
            test: /node_modules[\\/](?:\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?(?:astro|@astrojs)[\\/]/,
            priority: 35,
            // 不设 maxSize：Astro 内部模块有严格执行顺序依赖，不可强拆
        },

        // ── React 家族 ──────────────────────────────────────────
        {
            name: 'vendor-react',
            test: /node_modules[\\/](?:\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?(?:react|react-dom|scheduler)[\\/]/,
            priority: 30,
            maxSize: 200_000,
        },

        // ── Svelte 运行时 ───────────────────────────────────────
        {
            name: 'vendor-svelte',
            test: /node_modules[\\/](?:\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?(?:svelte|@sveltejs)[\\/]/,
            priority: 25,
            maxSize: 200_000,
        },

        // ── Three.js（游戏页重型依赖）─────────────────────────
        {
            name: 'vendor-three',
            test: /node_modules[\\/](?:\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?three(?:[\\/]|$)/,
            priority: 20,
            maxSize: 400_000,
            entriesAware: true, // 按实际入口拆分，避免未用到的 three 模块被其他页面加载
            entriesAwareMergeThreshold: 50_000,
        },

        // ── 兜底：剩余所有 node_modules ─────────────────────────
        // 不设 maxSize。让 Rolldown 自然聚合剩余依赖，
        // 执行顺序安全由 strictExecutionOrder 保证。
        {
            name: 'vendor',
            test: /node_modules[\\/]/,
            priority: 5,
        },
    ],
};