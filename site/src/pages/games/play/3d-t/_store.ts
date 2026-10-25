import { create } from 'zustand';
import { START_MONEY, START_LIVES, TOWER_DEFS } from './_constants';
import type { Enemy, GameStatus, TowerInstance } from './_types';

const TOWER_DEFS_CACHE = Object.fromEntries(TOWER_DEFS.map((d) => [d.id, d]));

interface GameState {
    money: number;
    lives: number;
    wave: number;
    status: GameStatus;
    towers: TowerInstance[];
    enemies: Enemy[];
    selectedTowerDef: string | null;
    selectedTowerId: string | null;

    startGame: () => void;
    resetGame: () => void;
    addTower: (defId: string, gx: number, gz: number) => boolean;
    removeTower: (id: string) => void;
    selectTowerDef: (defId: string | null) => void;
    selectTower: (id: string | null) => void;
    setEnemies: (enemies: Enemy[]) => void;
    setMoney: (money: number) => void;
    setLives: (lives: number) => void;
    setWave: (wave: number) => void;
    setStatus: (status: GameStatus) => void;
    addTowerDamage: (id: string, dmg: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    money: START_MONEY,
    lives: START_LIVES,
    wave: 0,
    status: 'idle',
    towers: [],
    enemies: [],
    selectedTowerDef: null,
    selectedTowerId: null,

    startGame: () =>
        set({
            money: START_MONEY,
            lives: START_LIVES,
            wave: 1,
            status: 'playing',
            towers: [],
            enemies: [],
            selectedTowerDef: null,
            selectedTowerId: null,
        }),

    resetGame: () =>
        set({
            money: START_MONEY,
            lives: START_LIVES,
            wave: 0,
            status: 'idle',
            towers: [],
            enemies: [],
            selectedTowerDef: null,
            selectedTowerId: null,
        }),

    addTower: (defId, gx, gz) => {
        const state = get();
        const def = TOWER_DEFS_CACHE[defId];
        if (!def || state.money < def.cost) return false;
        if (state.towers.some((t) => t.gridX === gx && t.gridZ === gz)) return false;
        const tower: TowerInstance = {
            id: `${defId}-${gx}-${gz}-${Date.now()}`,
            defId,
            gridX: gx,
            gridZ: gz,
            cooldown: 0,
            totalDamage: 0,
        };
        set({
            towers: [...state.towers, tower],
            money: state.money - def.cost,
        });
        return true;
    },

    removeTower: (id) => {
        const state = get();
        const tower = state.towers.find((t) => t.id === id);
        if (!tower) return;
        const def = TOWER_DEFS_CACHE[tower.defId];
        set({
            towers: state.towers.filter((t) => t.id !== id),
            money: state.money + (def ? Math.floor(def.cost * 0.6) : 0),
            selectedTowerId: state.selectedTowerId === id ? null : state.selectedTowerId,
        });
    },

    selectTowerDef: (defId) => set({ selectedTowerDef: defId, selectedTowerId: null }),
    selectTower: (id) => set({ selectedTowerId: id, selectedTowerDef: null }),

    setEnemies: (enemies) => set({ enemies }),
    setMoney: (money) => set({ money }),
    setLives: (lives) => set({ lives }),
    setWave: (wave) => set({ wave }),
    setStatus: (status) => set({ status }),

    addTowerDamage: (id, dmg) =>
        set({
            towers: get().towers.map((t) =>
                t.id === id ? { ...t, totalDamage: t.totalDamage + dmg } : t,
            ),
        }),
}));