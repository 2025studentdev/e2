export interface TowerDef {
    id: string;
    name: string;
    cost: number;
    damage: number;
    range: number;
    fireRate: number;
    color: string;
    description: string;
}

export interface TowerInstance {
    id: string;
    defId: string;
    gridX: number;
    gridZ: number;
    cooldown: number;
    totalDamage: number;
}

export interface Enemy {
    id: string;
    hp: number;
    maxHp: number;
    speed: number;
    pathIndex: number;
    pathProgress: number;
    x: number;
    z: number;
    reward: number;
}

export type GameStatus = 'idle' | 'playing' | 'victory' | 'defeat';