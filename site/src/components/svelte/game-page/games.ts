/**
 * 游戏清单 —— 唯一数据源
 *
 * 新增一个游戏：
 *   1. 建目录 src/pages/games/play/<slug>/ ，入口放 index.html
 *   2. 在下方数组追加一条 { slug, name, description }
 */

export interface GameEntry {
    /** 目录名，必须与 src/pages/games/play/<slug>/ 一致 */
    slug: string;
    /** 展示用游戏名 */
    name: string;
    /** 一句话描述 */
    description: string;
}

export const games: GameEntry[] = [
    {
        slug: 'snake',
        name: '贪吃蛇',
        description: '方向键控制，吃到食物变长，撞墙或撞自己结束。',
    },
    {
        slug: '2048',
        name: '2048',
        description: '滑动合并相同数字，目标是拼出 2048 方块。',
    },
    {
        slug: 'tetris',
        name: '俄罗斯方块',
        description: '旋转下落方块填满整行消除，速度随分数递增。',
    },
    {
        slug: 's',
        name: '扫雷',
        description: '扫雷游戏',
    },
    {
        slug: 'shudo',
        name: '数独',
        description: '数独游戏',
    },
    {
        slug: 'Tic-Tac-Toe',
        name: '井字棋',
        description: '井字棋游戏',
    },

];

/** 统一生成游戏访问路径 */
export const gamePath = (slug: string): string => `/games/play/${slug}/`;