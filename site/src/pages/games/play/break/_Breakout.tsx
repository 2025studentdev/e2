// D:\WebProj\e2\site\src\pages\games\play\break\Breakout.tsx
import { useCallback, useEffect, useRef, useState } from 'react';

/* =============================== 常量 =============================== */
const W = 960;
const H = 640;

const PADDLE_W = 148;
const PADDLE_H = 16;
const PADDLE_Y = H - 72;
const PADDLE_SPEED = 1050;
const BALL_R = 9;

const ROWS = 6;
const COLS = 10;
const BRICK_TOP = 92;
const BRICK_GAP = 12;
const BRICK_H = 30;
const SIDE_PAD = 64;
const BRICK_W = (W - SIDE_PAD * 2 - BRICK_GAP * (COLS - 1)) / COLS;

const ROW_COLORS = ['#5b8def', '#3fbfa8', '#f2b23e', '#f0788a', '#9a86f3', '#45b1e8'];

type Status = 'ready' | 'playing' | 'paused' | 'over' | 'clear';
type Sfx = (freq: number, dur: number, type?: OscillatorType, vol?: number) => void;

interface Brick {
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    alive: boolean;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    max: number;
    color: string;
    size: number;
    rot: number;
    vr: number;
}

interface GameState {
    ball: { x: number; y: number; vx: number; vy: number; speed: number };
    paddle: { x: number; targetX: number; w: number; h: number };
    bricks: Brick[];
    particles: Particle[];
    trail: { x: number; y: number }[];
    score: number;
    lives: number;
    level: number;
    combo: number;
    bestCombo: number;
    status: Status;
    stuck: boolean;
    shake: number;
    clearTimer: number;
    lastTs: number;
}

/* =============================== 工具 =============================== */
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

const comboMult = (c: number) => Math.min(4, 1 + Math.floor(c / 3));

function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
}

/* =============================== 关卡构建 =============================== */
function buildBricks(level: number): Brick[] {
    const bricks: Brick[] = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            // 高关卡挖出缺口，形成图案
            if (level >= 3 && r > 0 && r < ROWS - 1 && (r + c) % 6 === 0) continue;
            if (level >= 5 && r > 0 && (r * 3 + c) % 9 === 0) continue;

            bricks.push({
                x: SIDE_PAD + c * (BRICK_W + BRICK_GAP),
                y: BRICK_TOP + r * (BRICK_H + BRICK_GAP),
                w: BRICK_W,
                h: BRICK_H,
                color: ROW_COLORS[r % ROW_COLORS.length],
                alive: true,
            });
        }
    }
    return bricks;
}

function makeGame(): GameState {
    return {
        ball: { x: W / 2, y: PADDLE_Y - BALL_R - 1, vx: 0, vy: 0, speed: 470 },
        paddle: {
            x: W / 2 - PADDLE_W / 2,
            targetX: W / 2 - PADDLE_W / 2,
            w: PADDLE_W,
            h: PADDLE_H,
        },
        bricks: buildBricks(1),
        particles: [],
        trail: [],
        score: 0,
        lives: 3,
        level: 1,
        combo: 0,
        bestCombo: 0,
        status: 'ready',
        stuck: true,
        shake: 0,
        clearTimer: 0,
        lastTs: 0,
    };
}

/* =============================== 粒子 =============================== */
function spawnParticles(g: GameState, x: number, y: number, color: string) {
    for (let i = 0; i < 10; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 60 + Math.random() * 220;
        const life = 0.35 + Math.random() * 0.35;
        g.particles.push({
            x,
            y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp - 60,
            life,
            max: life,
            color,
            size: 3 + Math.random() * 4,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 12,
        });
    }
}

function updateParticles(g: GameState, dt: number) {
    const arr = g.particles;
    for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        p.life -= dt;
        if (p.life <= 0) {
            arr.splice(i, 1);
            continue;
        }
        p.vy += 900 * dt;
        p.vx *= 0.986;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
    }
    if (arr.length > 420) arr.splice(0, arr.length - 420);
}

/* =============================== 动作 =============================== */
function launchBall(g: GameState, sfx: Sfx) {
    if (!g.stuck || g.status !== 'ready') return;
    g.stuck = false;
    g.status = 'playing';
    const a = Math.random() * 0.6 - 0.3;
    g.ball.vx = Math.sin(a) * g.ball.speed;
    g.ball.vy = -Math.cos(a) * g.ball.speed;
    sfx(700, 0.08, 'sine', 0.05);
}

function nextLevel(g: GameState) {
    g.level += 1;
    g.bricks = buildBricks(g.level);
    g.ball.speed = Math.min(470 + (g.level - 1) * 32, 780);
    g.ball.vx = 0;
    g.ball.vy = 0;
    g.stuck = true;
    g.status = 'ready';
    g.combo = 0;
    g.particles.length = 0;
    g.trail.length = 0;
}

/* =============================== 更新 =============================== */
function update(
    g: GameState,
    dt: number,
    input: { left: boolean; right: boolean },
    sfx: Sfx,
) {
    g.shake *= Math.exp(-dt * 12);
    if (g.shake < 0.05) g.shake = 0;

    /* --- 挡板 --- */
    const p = g.paddle;
    if (input.left) p.targetX -= PADDLE_SPEED * dt;
    if (input.right) p.targetX += PADDLE_SPEED * dt;
    p.targetX = clamp(p.targetX, 0, W - p.w);
    p.x += (p.targetX - p.x) * (1 - Math.exp(-dt * 30));
    p.x = clamp(p.x, 0, W - p.w);

    updateParticles(g, dt);

    if (g.status === 'paused') return;

    if (g.status === 'clear') {
        g.clearTimer -= dt;
        if (g.clearTimer <= 0) nextLevel(g);
        return;
    }

    const ball = g.ball;

    if (g.stuck) {
        ball.x = p.x + p.w / 2;
        ball.y = PADDLE_Y - BALL_R - 1;
        g.trail.length = 0;
        return;
    }

    /* --- 速度归一化，避免数值漂移 --- */
    const sp = Math.hypot(ball.vx, ball.vy);
    if (sp > 0.001) {
        const k = ball.speed / sp;
        ball.vx *= k;
        ball.vy *= k;
    }

    /* --- 子步进防穿透 --- */
    const steps = Math.max(1, Math.ceil((ball.speed * dt) / 6));
    const sdt = dt / steps;

    for (let i = 0; i < steps; i++) {
        ball.x += ball.vx * sdt;
        ball.y += ball.vy * sdt;

        // 墙壁
        if (ball.x - BALL_R < 0) {
            ball.x = BALL_R;
            ball.vx = Math.abs(ball.vx);
            sfx(300, 0.05, 'square', 0.022);
        } else if (ball.x + BALL_R > W) {
            ball.x = W - BALL_R;
            ball.vx = -Math.abs(ball.vx);
            sfx(300, 0.05, 'square', 0.022);
        }
        if (ball.y - BALL_R < 0) {
            ball.y = BALL_R;
            ball.vy = Math.abs(ball.vy);
            sfx(300, 0.05, 'square', 0.022);
        }

        // 挡板
        if (
            ball.vy > 0 &&
            ball.y + BALL_R >= PADDLE_Y &&
            ball.y - BALL_R <= PADDLE_Y + p.h &&
            ball.x + BALL_R >= p.x &&
            ball.x - BALL_R <= p.x + p.w
        ) {
            const rel = clamp((ball.x - (p.x + p.w / 2)) / (p.w / 2), -1, 1);
            const angle = rel * (Math.PI / 3);
            const speed = Math.hypot(ball.vx, ball.vy);
            ball.vx = speed * Math.sin(angle);
            ball.vy = -speed * Math.cos(angle);
            ball.y = PADDLE_Y - BALL_R - 0.5;
            g.combo = 0;
            g.shake = Math.min(g.shake + 1.2, 4);
            sfx(520, 0.07, 'sine', 0.05);
        }

        // 砖块
        for (let bi = 0; bi < g.bricks.length; bi++) {
            const b = g.bricks[bi];
            if (!b.alive) continue;

            const nx = clamp(ball.x, b.x, b.x + b.w);
            const ny = clamp(ball.y, b.y, b.y + b.h);
            const dx = ball.x - nx;
            const dy = ball.y - ny;
            if (dx * dx + dy * dy > BALL_R * BALL_R) continue;

            const bcx = b.x + b.w / 2;
            const bcy = b.y + b.h / 2;
            const ox = BALL_R + b.w / 2 - Math.abs(ball.x - bcx);
            const oy = BALL_R + b.h / 2 - Math.abs(ball.y - bcy);

            if (ox < oy) {
                ball.vx = -ball.vx;
                ball.x += ball.x < bcx ? -ox : ox;
            } else {
                ball.vy = -ball.vy;
                ball.y += ball.y < bcy ? -oy : oy;
            }

            b.alive = false;
            g.combo += 1;
            if (g.combo > g.bestCombo) g.bestCombo = g.combo;
            g.score += 10 * comboMult(g.combo);
            g.shake = Math.min(g.shake + 2.4, 8);
            spawnParticles(g, nx, ny, b.color);
            sfx(420 + Math.min(g.combo, 12) * 45, 0.09, 'triangle', 0.042);
            break;
        }
    }

    /* --- 拖尾 --- */
    g.trail.push({ x: ball.x, y: ball.y });
    if (g.trail.length > 14) g.trail.shift();

    /* --- 掉球 --- */
    if (ball.y - BALL_R > H) {
        g.lives -= 1;
        g.combo = 0;
        g.trail.length = 0;
        sfx(160, 0.35, 'sawtooth', 0.06);
        if (g.lives <= 0) {
            g.status = 'over';
            g.stuck = true;
        } else {
            g.status = 'ready';
            g.stuck = true;
            ball.vx = 0;
            ball.vy = 0;
        }
    }

    /* --- 过关 --- */
    if (g.status === 'playing' && g.bricks.every((b) => !b.alive)) {
        g.status = 'clear';
        g.clearTimer = 1.0;
        g.stuck = true;
        g.trail.length = 0;
        sfx(660, 0.12, 'sine', 0.05);
        window.setTimeout(() => sfx(880, 0.2, 'sine', 0.045), 120);
    }
}

/* =============================== 渲染 =============================== */
function render(ctx: CanvasRenderingContext2D, g: GameState) {
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    if (g.shake > 0.1) {
        ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
    }

    /* 砖块 */
    for (const b of g.bricks) {
        if (!b.alive) continue;
        ctx.fillStyle = b.color;
        roundRect(ctx, b.x, b.y, b.w, b.h, 8);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.40)';
        roundRect(ctx, b.x + 6, b.y + 4, b.w - 12, 5, 2.5);
        ctx.fill();
    }

    /* 球拖尾 */
    const tl = g.trail.length;
    if (tl > 0) {
        ctx.fillStyle = '#1e293b';
        for (let i = 0; i < tl; i++) {
            const t = g.trail[i];
            const k = (i + 1) / tl;
            ctx.globalAlpha = k * 0.16;
            ctx.beginPath();
            ctx.arc(t.x, t.y, BALL_R * (0.3 + k * 0.65), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    /* 挡板 */
    const p = g.paddle;
    ctx.fillStyle = '#1e293b';
    roundRect(ctx, p.x, PADDLE_Y, p.w, p.h, 8);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    roundRect(ctx, p.x + p.w / 2 - 16, PADDLE_Y + 5.5, 32, 5, 2.5);
    ctx.fill();

    /* 球 */
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(g.ball.x, g.ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.80)';
    ctx.beginPath();
    ctx.arc(g.ball.x - BALL_R * 0.3, g.ball.y - BALL_R * 0.32, BALL_R * 0.32, 0, Math.PI * 2);
    ctx.fill();

    /* 粒子 */
    for (const pt of g.particles) {
        ctx.globalAlpha = Math.max(0, pt.life / pt.max);
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot);
        ctx.fillStyle = pt.color;
        ctx.fillRect(-pt.size / 2, -pt.size / 2, pt.size, pt.size);
        ctx.restore();
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    /* 发射提示 */
    if (g.status === 'ready' && g.stuck) {
        ctx.save();
        ctx.fillStyle = '#9aa5b8';
        ctx.font = '600 15px "Inter", system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('点击或按空格键发射', W / 2, PADDLE_Y - 78);
        ctx.restore();
    }

    /* 连击倍率 */
    const mult = comboMult(g.combo);
    if (mult > 1) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#3b82f6';
        ctx.font = '800 26px "Inter", system-ui, sans-serif';
        ctx.fillText(`${mult}x`, W / 2, 52);
        ctx.fillStyle = '#a3adbe';
        ctx.font = '600 11px "Inter", system-ui, sans-serif';
        ctx.fillText('COMBO', W / 2, 70);
        ctx.restore();
    }
}

/* =============================== 组件 =============================== */
export default function Breakout() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<GameState | null>(null);
    const keysRef = useRef({ left: false, right: false });
    const rafRef = useRef(0);
    const audioRef = useRef<AudioContext | null>(null);
    const soundRef = useRef(true);

    const actionsRef = useRef({
        launch: () => {},
        togglePause: () => {},
        restart: () => {},
    });

    const [ui, setUi] = useState({
        score: 0,
        lives: 3,
        level: 1,
        combo: 0,
        status: 'ready' as Status,
    });
    const [soundOn, setSoundOn] = useState(true);

    /* ---------------- 音效 ---------------- */
    const sfx = useCallback<Sfx>((freq, dur, type = 'sine', vol = 0.05) => {
        if (!soundRef.current) return;
        try {
            if (!audioRef.current) {
                const AC =
                    window.AudioContext ||
                    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
                if (!AC) return;
                audioRef.current = new AC();
            }
            const ac = audioRef.current;
            if (!ac) return;
            if (ac.state === 'suspended') void ac.resume();

            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ac.currentTime);
            gain.gain.setValueAtTime(vol, ac.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
            osc.connect(gain);
            gain.connect(ac.destination);
            osc.start();
            osc.stop(ac.currentTime + dur);
        } catch {
            /* 静默失败 */
        }
    }, []);

    /* ---------------- 主循环 ---------------- */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        gameRef.current = makeGame();

        /* 尺寸自适应 */
        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.max(1, Math.round(rect.width * dpr));
            canvas.height = Math.max(1, Math.round(rect.height * dpr));
            ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
        };

        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        window.addEventListener('resize', resize);

        /* 对外动作 */
        actionsRef.current = {
            launch: () => {
                const g = gameRef.current;
                if (g) launchBall(g, sfx);
            },
            togglePause: () => {
                const g = gameRef.current;
                if (!g) return;
                if (g.status === 'paused') {
                    g.status = g.stuck ? 'ready' : 'playing';
                } else if (g.status === 'playing' || g.status === 'ready') {
                    g.status = 'paused';
                }
                g.lastTs = 0;
            },
            restart: () => {
                gameRef.current = makeGame();
            },
        };

        /* UI 同步（值变化才 setState） */
        let last = { score: -1, lives: -1, level: -1, combo: -1, status: '' };
        const publish = (g: GameState) => {
            if (
                g.score !== last.score ||
                g.lives !== last.lives ||
                g.level !== last.level ||
                g.combo !== last.combo ||
                g.status !== last.status
            ) {
                last = {
                    score: g.score,
                    lives: g.lives,
                    level: g.level,
                    combo: g.combo,
                    status: g.status,
                };
                setUi({
                    score: g.score,
                    lives: g.lives,
                    level: g.level,
                    combo: g.combo,
                    status: g.status,
                });
            }
        };

        const loop = (ts: number) => {
            rafRef.current = requestAnimationFrame(loop);
            const g = gameRef.current;
            if (!g) return;

            const dt = Math.min((ts - (g.lastTs || ts)) / 1000, 0.05);
            g.lastTs = ts;

            update(g, dt, keysRef.current, sfx);
            render(ctx, g);
            publish(g);
        };

        rafRef.current = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(rafRef.current);
            ro.disconnect();
            window.removeEventListener('resize', resize);
        };
    }, [sfx]);

    /* ---------------- 键盘 ---------------- */
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const g = gameRef.current;
            if (!g) return;
            const k = e.key.toLowerCase();

            if (e.key === 'ArrowLeft' || k === 'a') {
                keysRef.current.left = true;
                e.preventDefault();
            } else if (e.key === 'ArrowRight' || k === 'd') {
                keysRef.current.right = true;
                e.preventDefault();
            } else if (e.code === 'Space') {
                e.preventDefault();
                if (g.status === 'ready') actionsRef.current.launch();
                else if (g.status === 'over') actionsRef.current.restart();
            } else if (k === 'p' || e.key === 'Escape') {
                e.preventDefault();
                actionsRef.current.togglePause();
            } else if (k === 'r') {
                actionsRef.current.restart();
            }
        };

        const onKeyUp = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
            if (e.key === 'ArrowLeft' || k === 'a') keysRef.current.left = false;
            if (e.key === 'ArrowRight' || k === 'd') keysRef.current.right = false;
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, []);

    /* ---------------- 指针 ---------------- */
    const movePaddle = useCallback((clientX: number) => {
        const g = gameRef.current;
        const canvas = canvasRef.current;
        if (!g || !canvas) return;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width) return;
        const x = ((clientX - rect.left) / rect.width) * W;
        g.paddle.targetX = clamp(x - g.paddle.w / 2, 0, W - g.paddle.w);
    }, []);

    const handlePointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            movePaddle(e.clientX);
        },
        [movePaddle],
    );

    const handlePointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const g = gameRef.current;
            if (!g) return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            movePaddle(e.clientX);
            if (g.status === 'ready') actionsRef.current.launch();
        },
        [movePaddle],
    );

    /* ---------------- 按钮 ---------------- */
    const handleResume = () => actionsRef.current.togglePause();
    const handleRestart = () => actionsRef.current.restart();
    const handleSound = () => {
        const next = !soundRef.current;
        soundRef.current = next;
        setSoundOn(next);
    };

    return (
        <div className="brk-shell">
            <header className="brk-head">
                <div className="brk-brand">
          <span className="brk-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
                    <h1 className="brk-title">Breakout</h1>
                </div>

                <div className="brk-stats">
                    <div className="brk-stat">
                        <span className="brk-stat-label">Score</span>
                        <span className="brk-stat-value">{ui.score}</span>
                    </div>
                    <div className="brk-stat">
                        <span className="brk-stat-label">Level</span>
                        <span className="brk-stat-value">{String(ui.level).padStart(2, '0')}</span>
                    </div>
                    <div className="brk-stat">
                        <span className="brk-stat-label">Combo</span>
                        <span className="brk-stat-value">{comboMult(ui.combo)}x</span>
                    </div>
                    <div className="brk-stat">
                        <span className="brk-stat-label">Lives</span>
                        <span className="brk-lives">
              {[0, 1, 2].map((i) => (
                  <span
                      key={i}
                      className={`brk-life${i >= ui.lives ? ' brk-life--off' : ''}`}
                  />
              ))}
            </span>
                    </div>
                </div>
            </header>

            <div
                className="brk-stage"
                ref={stageRef}
                onPointerMove={handlePointerMove}
                onPointerDown={handlePointerDown}
                onContextMenu={(e) => e.preventDefault()}
            >
                <canvas ref={canvasRef} className="brk-canvas" />

                {ui.status === 'paused' && (
                    <div className="brk-overlay">
                        <p className="brk-overlay-tag">Paused</p>
                        <h2 className="brk-overlay-title">游戏暂停</h2>
                        <p className="brk-overlay-desc">按 P 键或点击下方按钮继续</p>
                        <button type="button" className="brk-btn" onClick={handleResume}>
                            继续游戏
                        </button>
                    </div>
                )}

                {ui.status === 'over' && (
                    <div className="brk-overlay">
                        <p className="brk-overlay-tag">Game Over</p>
                        <h2 className="brk-overlay-title">最终得分 {ui.score}</h2>
                        <p className="brk-overlay-desc">你抵达了第 {ui.level} 关</p>
                        <button type="button" className="brk-btn" onClick={handleRestart}>
                            重新开始
                        </button>
                    </div>
                )}

                {ui.status === 'clear' && (
                    <div className="brk-overlay">
                        <p className="brk-overlay-tag">Level Clear</p>
                        <h2 className="brk-overlay-title">第 {ui.level} 关通过</h2>
                    </div>
                )}
            </div>

            <footer className="brk-foot">
                <div className="brk-keys">
                    <kbd>←</kbd>
                    <kbd>→</kbd>
                    <span>移动</span>
                    <kbd>Space</kbd>
                    <span>发射</span>
                    <kbd>P</kbd>
                    <span>暂停</span>
                    <kbd>R</kbd>
                    <span>重开</span>
                </div>
                <button type="button" className="brk-icon-btn" onClick={handleSound}>
                    {soundOn ? '音效 开' : '音效 关'}
                </button>
            </footer>
        </div>
    );
}