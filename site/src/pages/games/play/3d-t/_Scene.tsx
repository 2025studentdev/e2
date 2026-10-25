import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Cylinder, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from './_store';
import {
    GRID_SIZE,
    CELL_SIZE,
    MAP_OFFSET,
    PATH,
    PATH_CELLS,
    PATH_DIR,
    PATH_SET,
    TOWER_DEFS,
    TOTAL_WAVES,
} from './_constants';
import type { Enemy } from './_types';

/* ---------- 工具 ---------- */
function gridToWorld(gx: number, gz: number): [number, number] {
    return [gx * CELL_SIZE - MAP_OFFSET + CELL_SIZE / 2, gz * CELL_SIZE - MAP_OFFSET + CELL_SIZE / 2];
}

/* ---------- 敌人 ---------- */
function EnemyMesh({ enemy }: { enemy: Enemy }) {
    const meshRef = useRef<THREE.Group>(null!);
    const hpRatio = enemy.hp / enemy.maxHp;

    useFrame(() => {
        if (!meshRef.current) return;
        meshRef.current.position.set(enemy.x, 0.35, enemy.z);
    });

    const color = hpRatio > 0.6 ? '#e76f51' : hpRatio > 0.3 ? '#f4a261' : '#e63946';

    return (
        <group ref={meshRef}>
            <Sphere args={[0.28, 12, 12]} castShadow>
                <meshStandardMaterial color={color} roughness={0.3} />
            </Sphere>
            <mesh position={[0, 0.45, 0]}>
                <boxGeometry args={[0.5 * hpRatio, 0.06, 0.08]} />
                <meshBasicMaterial color={hpRatio > 0.3 ? '#2a9d8f' : '#e63946'} />
            </mesh>
        </group>
    );
}

/* ---------- 塔 ---------- */
function TowerMesh({ tower, onClick }: { tower: any; onClick: () => void }) {
    const def = TOWER_DEFS.find((d) => d.id === tower.defId)!;
    const [wx, wz] = gridToWorld(tower.gridX, tower.gridZ);

    return (
        <group position={[wx, 0, wz]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
            <Cylinder args={[0.35, 0.45, 0.5, 8]} position={[0, 0.25, 0]} castShadow>
                <meshStandardMaterial color={def.color} roughness={0.4} metalness={0.3} />
            </Cylinder>
            <Cylinder args={[0.18, 0.22, 0.3, 8]} position={[0, 0.65, 0]} castShadow>
                <meshStandardMaterial color="#f1faee" roughness={0.5} />
            </Cylinder>
            <Sphere args={[0.1, 8, 8]} position={[0, 0.85, 0]}>
                <meshBasicMaterial color={def.color} />
            </Sphere>
        </group>
    );
}

/* ---------- 路径方向箭头（每个路径格一个） ---------- */
function PathArrows() {
    return (
        <>
            {PATH_CELLS.map(([gx, gz]) => {
                const dir = PATH_DIR.get(`${gx},${gz}`);
                if (!dir) return null;
                const [dx, dz] = dir;
                const [wx, wz] = gridToWorld(gx, gz);
                const angle = Math.atan2(dz, dx);
                return (
                    <group
                        key={`arrow-${gx}-${gz}`}
                        position={[wx, 0.06, wz]}
                        rotation={[0, -angle, 0]}
                    >
                        <mesh rotation={[0, 0, -Math.PI / 2]}>
                            <coneGeometry args={[0.08, 0.22, 4]} />
                            <meshBasicMaterial color="#8a7f6d" />
                        </mesh>
                    </group>
                );
            })}
        </>
    );
}

/* ---------- 起点标记 ---------- */
function StartMarker() {
    const [wx, wz] = gridToWorld(...PATH[0]);
    return (
        <group position={[wx, 0, wz]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[0.38, 0.52, 32]} />
                <meshBasicMaterial color="#2a9d8f" side={THREE.DoubleSide} transparent opacity={0.9} />
            </mesh>
            <mesh position={[0, 0.6, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
                <meshStandardMaterial color="#2a9d8f" roughness={0.5} />
            </mesh>
            <mesh position={[0, 1.22, 0]}>
                <sphereGeometry args={[0.08, 12, 12]} />
                <meshStandardMaterial color="#2a9d8f" roughness={0.4} />
            </mesh>
        </group>
    );
}

/* ---------- 终点标记 ---------- */
function EndMarker() {
    const [wx, wz] = gridToWorld(...PATH[PATH.length - 1]);
    const ringRef = useRef<THREE.Mesh>(null!);

    useFrame((state) => {
        if (!ringRef.current) return;
        const s = 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.15;
        ringRef.current.scale.set(s, s, 1);
    });

    return (
        <group position={[wx, 0, wz]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[0.42, 0.6, 32]} />
                <meshBasicMaterial color="#e63946" side={THREE.DoubleSide} />
            </mesh>
            <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                <ringGeometry args={[0.28, 0.42, 32]} />
                <meshBasicMaterial color="#e63946" side={THREE.DoubleSide} transparent opacity={0.7} />
            </mesh>
            <mesh position={[0, 0.8, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 1.6, 8]} />
                <meshStandardMaterial color="#e63946" roughness={0.5} />
            </mesh>
            <mesh position={[0.22, 1.5, 0]}>
                <planeGeometry args={[0.44, 0.28]} />
                <meshStandardMaterial color="#e63946" side={THREE.DoubleSide} roughness={0.6} />
            </mesh>
        </group>
    );
}

/* ---------- 网格单元 ---------- */
function Cell({
                  gx,
                  gz,
                  occupied,
                  isPath,
                  isHovered,
                  onClick,
                  onPointerOver,
                  onPointerOut,
              }: {
    gx: number;
    gz: number;
    occupied: boolean;
    isPath: boolean;
    isHovered: boolean;
    onClick: () => void;
    onPointerOver: () => void;
    onPointerOut: () => void;
}) {
    const [wx, wz] = gridToWorld(gx, gz);
    const color = isPath ? '#cfc0a0' : isHovered ? '#f0e6d2' : '#eae6df';
    const opacity = occupied ? 0 : 1;

    return (
        <mesh
            position={[wx, -0.02, wz]}
            rotation={[-Math.PI / 2, 0, 0]}
            onClick={onClick}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
            receiveShadow
        >
            <planeGeometry args={[CELL_SIZE * 0.94, CELL_SIZE * 0.94]} />
            <meshStandardMaterial color={color} transparent opacity={opacity} />
        </mesh>
    );
}

/* ---------- 主场景内容 ---------- */
function SceneContent() {
    const { camera } = useThree();
    const {
        status, towers, enemies,
        addTower, setEnemies, setMoney, setLives,
        setWave, setStatus, addTowerDamage, selectTower,
    } = useGameStore();

    const wave = useGameStore((s) => s.wave);
    const waveEnemyCount = useMemo(() => 4 + wave * 2, [wave]);

    const enemiesRef = useRef<Enemy[]>([]);
    const towersRef = useRef(towers);
    towersRef.current = towers;
    const spawnedRef = useRef(0);
    const spawnTimerRef = useRef(0);
    const [hoveredCell, setHoveredCell] = useState<{ gx: number; gz: number } | null>(null);

    useEffect(() => {
        camera.position.set(10, 12, 10);
        camera.lookAt(0, 0, 0);
    }, [camera]);

    // 开始游戏 / 重开时重置生成器
    useEffect(() => {
        if (status === 'playing') {
            spawnedRef.current = 0;
            spawnTimerRef.current = 1.5;
            enemiesRef.current = [];
        }
    }, [status]);

    // 游戏主循环
    useFrame((_, delta) => {
        const state = useGameStore.getState();
        if (state.status !== 'playing') return;
        const dt = Math.min(delta, 0.05);

        /* ---- 1. 生成敌人 ---- */
        const currentWave = state.wave;
        if (spawnedRef.current < waveEnemyCount) {
            spawnTimerRef.current -= dt;
            if (spawnTimerRef.current <= 0) {
                spawnTimerRef.current = 1.2;
                const hp = 30 + currentWave * 18;
                const newEnemy: Enemy = {
                    id: `e-${Date.now()}-${spawnedRef.current}`,
                    hp,
                    maxHp: hp,
                    speed: 1.2 + currentWave * 0.12,
                    pathIndex: 0,
                    pathProgress: 0,
                    x: gridToWorld(...PATH[0])[0],
                    z: gridToWorld(...PATH[0])[1],
                    reward: 12 + currentWave * 3,
                };
                spawnedRef.current++;
                const updated = [...enemiesRef.current, newEnemy];
                enemiesRef.current = updated;
                setEnemies(updated);
            }
        }

        /* ---- 2. 移动敌人 ---- */
        let livesLost = 0;
        const moved: Enemy[] = [];
        for (const e of enemiesRef.current) {
            let { pathIndex, pathProgress, x, z, hp } = e;
            if (hp <= 0) continue;

            const targetIdx = pathIndex + 1;
            if (targetIdx >= PATH.length) {
                livesLost++;
                continue;
            }

            const [tx, tz] = gridToWorld(...PATH[targetIdx]);
            const [cx, cz] = gridToWorld(...PATH[pathIndex]);
            const segLen = Math.hypot(tx - cx, tz - cz) || 1;
            pathProgress += (e.speed * dt) / segLen;

            if (pathProgress >= 1) {
                pathIndex++;
                pathProgress = 0;
                [x, z] = [tx, tz];
            } else {
                x = cx + (tx - cx) * pathProgress;
                z = cz + (tz - cz) * pathProgress;
            }

            moved.push({ ...e, pathIndex, pathProgress, x, z, hp });
        }

        if (livesLost > 0) {
            const newLives = Math.max(0, state.lives - livesLost);
            setLives(newLives);
            if (newLives <= 0) {
                setStatus('defeat');
                setEnemies([]);
                enemiesRef.current = [];
                return;
            }
        }

        /* ---- 3. 塔攻击 ---- */
        let goldEarned = 0;
        for (const tower of towersRef.current) {
            const def = TOWER_DEFS.find((d) => d.id === tower.defId);
            if (!def) continue;
            const [tx, tz] = gridToWorld(tower.gridX, tower.gridZ);
            let best: Enemy | null = null;
            let bestDist = Infinity;

            for (const e of moved) {
                if (e.hp <= 0) continue;
                const dist = Math.hypot(e.x - tx, e.z - tz);
                if (dist <= def.range && dist < bestDist) {
                    bestDist = dist;
                    best = e;
                }
            }

            if (best) {
                const newCd = tower.cooldown - dt;
                if (newCd <= 0) {
                    const nextCd = 1 / def.fireRate;
                    best.hp -= def.damage;
                    goldEarned += best.hp <= 0 ? best.reward : 0;
                    useGameStore.setState({
                        towers: useGameStore.getState().towers.map((t) =>
                            t.id === tower.id ? { ...t, cooldown: nextCd } : t,
                        ),
                    });
                    addTowerDamage(tower.id, def.damage);
                } else {
                    useGameStore.setState({
                        towers: useGameStore.getState().towers.map((t) =>
                            t.id === tower.id ? { ...t, cooldown: newCd } : t,
                        ),
                    });
                }
            }
        }

        if (goldEarned > 0) setMoney(state.money + goldEarned);

        const alive = moved.filter((e) => e.hp > 0);
        enemiesRef.current = alive;
        setEnemies(alive);

        /* ---- 4. 胜利 / 进入下一波 ---- */
        if (spawnedRef.current >= waveEnemyCount && alive.length === 0) {
            if (state.wave >= TOTAL_WAVES) {
                setStatus('victory');
            } else {
                setWave(state.wave + 1);
                spawnedRef.current = 0;
                spawnTimerRef.current = 1.5;
                setMoney(state.money + 30);
            }
        }
    });

    /* ---- 交互 ---- */
    const handleCellClick = (gx: number, gz: number) => {
        const state = useGameStore.getState();
        if (state.status !== 'playing') return;
        if (PATH_SET.has(`${gx},${gz}`)) return;
        if (state.towers.some((t) => t.gridX === gx && t.gridZ === gz)) return;
        if (!state.selectedTowerDef) return;
        addTower(state.selectedTowerDef, gx, gz);
    };

    return (
        <>
            <ambientLight intensity={0.7} />
            <directionalLight position={[8, 14, 6]} intensity={1.1} castShadow shadow-mapSize={[2048, 2048]} />
            <hemisphereLight args={['#ffffff', '#c8d5e0', 0.4]} />

            <Grid
                args={[GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE]}
                cellSize={CELL_SIZE}
                cellColor="#c8c2b8"
                sectionSize={CELL_SIZE * 3}
                sectionColor="#a89f94"
                fadeDistance={40}
                position={[0, -0.05, 0]}
            />

            {/* 路径标注：箭头 + 起终点 */}
            <PathArrows />
            <StartMarker />
            <EndMarker />

            {/* 可交互网格单元（包含路径格着色） */}
            {Array.from({ length: GRID_SIZE }, (_, gx) =>
                Array.from({ length: GRID_SIZE }, (_, gz) => {
                    const isPath = PATH_SET.has(`${gx},${gz}`);
                    const occupied = towers.some((t) => t.gridX === gx && t.gridZ === gz);
                    return (
                        <Cell
                            key={`cell-${gx}-${gz}`}
                            gx={gx}
                            gz={gz}
                            occupied={occupied}
                            isPath={isPath}
                            isHovered={hoveredCell?.gx === gx && hoveredCell?.gz === gz}
                            onClick={() => handleCellClick(gx, gz)}
                            onPointerOver={() => !isPath && !occupied && setHoveredCell({ gx, gz })}
                            onPointerOut={() => setHoveredCell(null)}
                        />
                    );
                }),
            )}

            {/* 塔 */}
            {towers.map((t) => (
                <TowerMesh key={t.id} tower={t} onClick={() => selectTower(t.id)} />
            ))}

            {/* 敌人 */}
            {enemies.map((e) => (
                <EnemyMesh key={e.id} enemy={e} />
            ))}

            <OrbitControls
                enablePan
                enableZoom
                enableRotate
                minPolarAngle={0.3}
                maxPolarAngle={Math.PI / 2.2}
                target={[0, 0, 0]}
            />
        </>
    );
}

/* ---------- Canvas 导出 ---------- */
export default function Scene() {
    return (
        <Canvas
            shadows
            camera={{ position: [10, 12, 10], fov: 45, near: 0.1, far: 100 }}
            style={{ width: '100%', height: '100%' }}
            onPointerMissed={() => {
                useGameStore.getState().selectTower(null);
                useGameStore.getState().selectTowerDef(null);
            }}
        >
            <SceneContent />
        </Canvas>
    );
}