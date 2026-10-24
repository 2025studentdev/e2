import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import './_Watermelon.css';

const { Engine, Render, World, Bodies, Runner, Events, Body, Composite } = Matter;

const FRUITS = [
    { level: 0, radius: 22, color: '#F6BD60' },
    { level: 1, radius: 30, color: '#F7EDE2' },
    { level: 2, radius: 38, color: '#F5CAC3' },
    { level: 3, radius: 46, color: '#84A59D' },
    { level: 4, radius: 55, color: '#F28482' },
    { level: 5, radius: 65, color: '#F6BD60' },
    { level: 6, radius: 76, color: '#F7EDE2' },
    { level: 7, radius: 88, color: '#F5CAC3' },
    { level: 8, radius: 101, color: '#84A59D' },
    { level: 9, radius: 115, color: '#F28482' },
    { level: 10, radius: 130, color: '#E76F51' },
];

const MAX_LEVEL = FRUITS.length - 1;
const DANGER_Y = 120;
const NEW_FRUIT_IMMUNITY_MS = 800; // 新水果免疫危险线判定
const DANGER_LINGER_MS = 1000;     // 低速过线持续多久算游戏结束
const DANGER_SPEED_THRESHOLD = 0.1;
const DROP_COOLDOWN_MS = 500;

interface FruitBody extends Matter.Body {
    fruitLevel: number;
    isMerged?: boolean;
    bornAt: number;
}

function createFruit(x: number, y: number, level: number, isStatic: boolean): FruitBody {
    const config = FRUITS[level];
    const body = Bodies.circle(x, y, config.radius, {
        isStatic,
        restitution: 0.2,
        friction: 0.1,
        frictionAir: 0.01,
        density: 0.001,
        // 待落水果不参与任何碰撞，落下时恢复
        collisionFilter: isStatic ? { mask: 0 } : { mask: 0xFFFFFFFF },
        render: {
            fillStyle: config.color,
            strokeStyle: '#D4C9BE',
            lineWidth: 2,
        },
    }) as FruitBody;
    body.fruitLevel = level;
    body.isMerged = false;
    body.bornAt = performance.now();
    return body;
}

const WatermelonGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [nextPreview, setNextPreview] = useState(0);

    const gameOverRef = useRef(false);
    const currentFruitRef = useRef<FruitBody | null>(null);
    const nextLevelRef = useRef(0);
    const isDroppingRef = useRef(false);

    useEffect(() => {
        const prevTitle = document.title;
        document.title = '合成大西瓜';

        if (!canvasRef.current) return;

        const width = 500;
        const height = 700;

        const engine = Engine.create({ gravity: { y: 1, x: 0, scale: 0.001 } });

        const render = Render.create({
            canvas: canvasRef.current,
            engine,
            options: {
                width,
                height,
                wireframes: false,
                background: '#FDF8F0',
                showAngleIndicator: false,
            },
        });

        const floorTop = height - 50;
        const walls = [
            Bodies.rectangle(width / 2, height - 25, width, 50, {
                isStatic: true,
                render: { fillStyle: '#E8E0D5' },
            }),
            Bodies.rectangle(-25, height / 2, 50, height, {
                isStatic: true,
                render: { fillStyle: '#E8E0D5' },
            }),
            Bodies.rectangle(width + 25, height / 2, 50, height, {
                isStatic: true,
                render: { fillStyle: '#E8E0D5' },
            }),
        ];
        World.add(engine.world, walls);

        const randomLevel = () => Math.floor(Math.random() * 5);

        const firstFruit = createFruit(width / 2, 60, randomLevel(), true);
        currentFruitRef.current = firstFruit;
        World.add(engine.world, firstFruit);

        nextLevelRef.current = randomLevel();
        setNextPreview(nextLevelRef.current);

        const runner = Runner.create();
        Runner.run(runner, engine);
        Render.run(render);

        // ---------- 合并 ----------
        const onCollisionStart = (event: Matter.IEventCollision<Matter.Engine>) => {
            for (const pair of event.pairs) {
                const a = pair.bodyA as FruitBody;
                const b = pair.bodyB as FruitBody;

                if (a.fruitLevel === undefined || b.fruitLevel === undefined) continue;
                // 关键：静态待落水果不参与合并
                if (a.isStatic || b.isStatic) continue;
                if (a.fruitLevel !== b.fruitLevel) continue;
                if (a.fruitLevel >= MAX_LEVEL) continue;
                if (a.isMerged || b.isMerged) continue;

                a.isMerged = true;
                b.isMerged = true;

                const midX = (a.position.x + b.position.x) / 2;
                const midY = (a.position.y + b.position.y) / 2;

                World.remove(engine.world, a);
                World.remove(engine.world, b);

                const newLevel = a.fruitLevel + 1;
                const newRadius = FRUITS[newLevel].radius;
                // 保证新水果完全在地板上方，避免生成时与地板重叠被弹飞
                const spawnY = Math.min(midY, floorTop - newRadius - 1);

                const newFruit = createFruit(midX, spawnY, newLevel, false);
                World.add(engine.world, newFruit);

                setScore((prev) => prev + (newLevel + 1) * 10);
            }
        };
        Events.on(engine, 'collisionStart', onCollisionStart);

        // ---------- 游戏结束：持续低速过线才算 ----------
        const dangerSince = new Map<number, number>();

        const onAfterUpdate = () => {
            if (gameOverRef.current) return;
            const now = performance.now();
            const bodies = Composite.allBodies(engine.world).filter(
                (b) => !b.isStatic && (b as FruitBody).fruitLevel !== undefined
            );

            const aliveIds = new Set<number>();

            for (const body of bodies) {
                const fruit = body as FruitBody;
                aliveIds.add(body.id);

                // 新生成/新合并的水果免疫
                if (now - fruit.bornAt < NEW_FRUIT_IMMUNITY_MS) {
                    dangerSince.delete(body.id);
                    continue;
                }

                if (body.position.y < DANGER_Y && body.speed < DANGER_SPEED_THRESHOLD) {
                    const since = dangerSince.get(body.id) ?? now;
                    dangerSince.set(body.id, since);
                    if (now - since >= DANGER_LINGER_MS) {
                        gameOverRef.current = true;
                        setGameOver(true);
                        Runner.stop(runner);
                        return;
                    }
                } else {
                    dangerSince.delete(body.id);
                }
            }

            // 清理已消失水果的记录
            for (const id of Array.from(dangerSince.keys())) {
                if (!aliveIds.has(id)) dangerSince.delete(id);
            }
        };
        Events.on(engine, 'afterUpdate', onAfterUpdate);

        // ---------- 交互 ----------
        const handlePointerMove = (e: MouseEvent | TouchEvent) => {
            if (e.type === 'touchmove' && e.cancelable) e.preventDefault();
            if (gameOverRef.current) return;

            const fruit = currentFruitRef.current;
            if (!fruit || !fruit.isStatic) return;
            if ('touches' in e && e.touches.length === 0) return;

            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const x = ((clientX - rect.left) / rect.width) * width;

            const r = fruit.circleRadius ?? FRUITS[fruit.fruitLevel].radius;
            const clampedX = Math.max(r + 6, Math.min(width - r - 6, x));
            Body.setPosition(fruit, { x: clampedX, y: fruit.position.y });
        };

        let dropTimer: number | undefined;

        const handlePointerDown = (e: Event) => {
            if (e.cancelable && e.type === 'touchstart') e.preventDefault();
            if (gameOverRef.current) return;

            const fruit = currentFruitRef.current;
            if (!fruit || !fruit.isStatic || isDroppingRef.current) return;

            isDroppingRef.current = true;
            // 落下时恢复碰撞
            fruit.collisionFilter.mask = 0xFFFFFFFF;
            Body.setStatic(fruit, false);
            currentFruitRef.current = null;

            dropTimer = window.setTimeout(() => {
                dropTimer = undefined;
                if (gameOverRef.current) {
                    isDroppingRef.current = false;
                    return;
                }

                const level = nextLevelRef.current;
                const newFruit = createFruit(width / 2, 60, level, true);
                currentFruitRef.current = newFruit;
                World.add(engine.world, newFruit);

                const next = randomLevel();
                nextLevelRef.current = next;
                setNextPreview(next);
                isDroppingRef.current = false;
            }, DROP_COOLDOWN_MS);
        };

        const canvas = canvasRef.current;
        canvas.addEventListener('mousemove', handlePointerMove);
        canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
        canvas.addEventListener('mousedown', handlePointerDown);
        canvas.addEventListener('touchstart', handlePointerDown, { passive: false });

        // ---------- 清理 ----------
        return () => {
            Events.off(engine, 'collisionStart', onCollisionStart);
            Events.off(engine, 'afterUpdate', onAfterUpdate);

            if (dropTimer !== undefined) {
                clearTimeout(dropTimer);
                dropTimer = undefined;
            }

            Runner.stop(runner);
            Render.stop(render);
            World.clear(engine.world, false);
            Engine.clear(engine);

            canvas.removeEventListener('mousemove', handlePointerMove);
            canvas.removeEventListener('touchmove', handlePointerMove);
            canvas.removeEventListener('mousedown', handlePointerDown);
            canvas.removeEventListener('touchstart', handlePointerDown);

            currentFruitRef.current = null;
            isDroppingRef.current = false;
            gameOverRef.current = false;

            document.title = prevTitle;
        };
    }, []);

    const handleRestart = () => window.location.reload();

    const previewRadius = Math.min(FRUITS[nextPreview].radius * 2, 56);

    return (
        <div className="watermelon-container">
            <div className="game-header">
                <div className="score-board">分数：{score}</div>
                <div className="next-preview">
                    <span>下一个</span>
                    <div
                        className="preview-circle"
                        style={{
                            width: previewRadius,
                            height: previewRadius,
                            backgroundColor: FRUITS[nextPreview].color,
                        }}
                    />
                </div>
            </div>

            <div className="canvas-wrapper">
                <canvas ref={canvasRef} width={500} height={700} />
                {gameOver && (
                    <div className="game-over-overlay">
                        <div className="game-over-card">
                            <h2>游戏结束</h2>
                            <p>最终分数：{score}</p>
                            <button onClick={handleRestart}>重新开始</button>
                        </div>
                    </div>
                )}
            </div>

            <p className="hint">移动鼠标或手指控制水果位置，点击或触摸落下</p>
        </div>
    );
};

export default WatermelonGame;