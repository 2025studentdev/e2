import type { TowerDef } from './_types';

export const GRID_SIZE = 12;
export const CELL_SIZE = 1.2;
export const MAP_OFFSET = (GRID_SIZE * CELL_SIZE) / 2;

// 敌人路径拐点（网格坐标）
export const PATH: [number, number][] = [
    [0, 0], [0, 3], [3, 3], [3, 6], [6, 6], [6, 9], [9, 9],
    [9, 5], [11, 5], [11, 2], [8, 2], [8, 0],
];

// 把拐点路径展开成连续的每一格，保证整条路都被标色、也不可建塔
function expandPath(points: [number, number][]): [number, number][] {
    const cells: [number, number][] = [points[0]];
    for (let i = 0; i < points.length - 1; i++) {
        const [x1, z1] = points[i];
        const [x2, z2] = points[i + 1];
        const dx = Math.sign(x2 - x1);
        const dz = Math.sign(z2 - z1);
        let x = x1;
        let z = z1;
        while (x !== x2 || z !== z2) {
            x += dx;
            z += dz;
            cells.push([x, z]);
        }
    }
    return cells;
}

export const PATH_CELLS = expandPath(PATH);
export const PATH_SET = new Set(PATH_CELLS.map(([x, z]) => `${x},${z}`));

// 每个路径格指向下一格的方向，用于画箭头
export const PATH_DIR = new Map<string, [number, number]>();
for (let i = 0; i < PATH_CELLS.length - 1; i++) {
    const [x1, z1] = PATH_CELLS[i];
    const [x2, z2] = PATH_CELLS[i + 1];
    PATH_DIR.set(`${x1},${z1}`, [x2 - x1, z2 - z1]);
}

export const TOWER_DEFS: TowerDef[] = [
    {
        id: 'cannon',
        name: '脉冲炮',
        cost: 80,
        damage: 22,
        range: 2.8,
        fireRate: 0.7,
        color: '#e07a5f',
        description: '均衡型防御塔，中等伤害与射程',
    },
    {
        id: 'sniper',
        name: '长程狙击',
        cost: 120,
        damage: 55,
        range: 5.5,
        fireRate: 0.25,
        color: '#3d5a80',
        description: '超远射程，高单发伤害，射速较慢',
    },
    {
        id: 'rapid',
        name: '速射阵列',
        cost: 60,
        damage: 8,
        range: 2.0,
        fireRate: 2.8,
        color: '#81b29a',
        description: '高射速低伤害，适合清理轻型敌人',
    },
];

export const START_MONEY = 280;
export const START_LIVES = 20;
export const TOTAL_WAVES = 8;