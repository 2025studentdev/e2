import { useEffect, useRef, useState } from 'react';
import './_class-sleep.css';

type Phase = 'ready' | 'playing' | 'over';
type TeacherState = 'away' | 'turning' | 'watching';

const AWAY_MIN = 2400;
const AWAY_MAX = 5200;
const TURN_WARN = 640;
const WATCH_MIN = 1000;
const WATCH_MAX = 1900;
const REACT_GRACE = 170;
const SLEEP_RATE = 0.01;

const TEACHER_LABEL: Record<TeacherState, string> = {
    away: '背对',
    turning: '转身',
    watching: '注视',
};

interface ViewState {
    score: number;
    teacherState: TeacherState;
    teacherX: number;
    sleeping: boolean;
}

const INITIAL_VIEW: ViewState = {
    score: 0,
    teacherState: 'away',
    teacherX: 72,
    sleeping: false,
};

export default function ClassSleepGame() {
    const [phase, setPhase] = useState<Phase>('ready');
    const [view, setView] = useState<ViewState>(INITIAL_VIEW);

    const holdingRef = useRef(false);
    const gameRef = useRef({
        teacherState: 'away' as TeacherState,
        timer: 0,
        teacherX: 72,
        targetX: 72,
        score: 0,
        caughtTimer: 0,
    });

    const startGame = () => {
        gameRef.current = {
            teacherState: 'away',
            timer: AWAY_MIN + Math.random() * (AWAY_MAX - AWAY_MIN),
            teacherX: 72,
            targetX: 72,
            score: 0,
            caughtTimer: 0,
        };
        holdingRef.current = false;
        setView(INITIAL_VIEW);
        setPhase('playing');
    };

    /* ---------- 游戏主循环 ---------- */
    useEffect(() => {
        if (phase !== 'playing') return;

        let raf = 0;
        let last = performance.now();

        const tick = (now: number) => {
            const dt = Math.min(now - last, 120);
            last = now;
            const g = gameRef.current;

            /* 老师状态机 */
            g.timer -= dt;
            if (g.timer <= 0) {
                if (g.teacherState === 'away') {
                    g.teacherState = 'turning';
                    g.timer = TURN_WARN;
                } else if (g.teacherState === 'turning') {
                    g.teacherState = 'watching';
                    g.timer = WATCH_MIN + Math.random() * (WATCH_MAX - WATCH_MIN);
                } else {
                    g.teacherState = 'away';
                    g.timer = AWAY_MIN + Math.random() * (AWAY_MAX - AWAY_MIN);
                }
            }

            /* 老师走动 */
            if (g.teacherState === 'away') {
                if (Math.abs(g.targetX - g.teacherX) < 0.3 && Math.random() < 0.01) {
                    g.targetX = 60 + Math.random() * 20;
                }
                g.teacherX += (g.targetX - g.teacherX) * Math.min(1, dt / 700);
            } else {
                g.teacherX += (68 - g.teacherX) * Math.min(1, dt / 900);
            }

            /* 睡眠累积 */
            const sleeping = holdingRef.current;
            if (sleeping) g.score += dt * SLEEP_RATE;

            /* 抓包判定 */
            if (g.teacherState === 'watching' && sleeping) {
                g.caughtTimer += dt;
                if (g.caughtTimer >= REACT_GRACE) {
                    setView({
                        score: g.score,
                        teacherState: g.teacherState,
                        teacherX: g.teacherX,
                        sleeping,
                    });
                    setPhase('over');
                    return;
                }
            } else {
                g.caughtTimer = 0;
            }

            setView({
                score: g.score,
                teacherState: g.teacherState,
                teacherX: g.teacherX,
                sleeping,
            });

            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [phase]);

    /* ---------- 输入 ---------- */
    useEffect(() => {
        const release = () => {
            holdingRef.current = false;
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                holdingRef.current = true;
            }
        };

        const onKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                holdingRef.current = false;
            }
        };

        window.addEventListener('pointerup', release);
        window.addEventListener('pointercancel', release);
        window.addEventListener('blur', release);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        return () => {
            window.removeEventListener('pointerup', release);
            window.removeEventListener('pointercancel', release);
            window.removeEventListener('blur', release);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, []);

    const handleStageDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (phase !== 'playing') return;
        e.preventDefault();
        holdingRef.current = true;
    };

    /* ---------- 渲染 ---------- */
    return (
        <div className="cs-root">
            <div className="cs-frame">
                <div className="cs-hud">
                    <div className="cs-stat">
                        <span className="cs-stat__label">摸鱼值</span>
                        <span className="cs-stat__value">{Math.floor(view.score)}</span>
                    </div>
                    <div className="cs-stat">
                        <span className="cs-stat__label">状态</span>
                        <span className="cs-stat__value">
              {view.sleeping ? '熟睡' : '清醒'}
            </span>
                    </div>
                    <div className="cs-stat cs-stat--right">
                        <span className="cs-stat__label">老师</span>
                        <span
                            className={`cs-stat__value cs-stat__value--${view.teacherState}`}
                        >
              {TEACHER_LABEL[view.teacherState]}
            </span>
                    </div>
                </div>

                <div className="cs-stage" onPointerDown={handleStageDown}>
                    <div className="cs-floor" />

                    <div className="cs-blackboard">
                        <span className="cs-chalk" style={{ width: '52%', top: '26%' }} />
                        <span className="cs-chalk" style={{ width: '34%', top: '44%' }} />
                        <span className="cs-chalk" style={{ width: '62%', top: '62%' }} />
                    </div>

                    <div
                        className="cs-teacher"
                        data-state={view.teacherState}
                        style={{ left: `${view.teacherX}%` }}
                    >
                        <span className="cs-teacher__alert" />
                        <div className="cs-teacher__head">
                            <div className="cs-teacher__eyes">
                                <i />
                                <i />
                            </div>
                        </div>
                        <div className="cs-teacher__body" />
                    </div>

                    <div className="cs-student" data-sleeping={view.sleeping}>
                        <div className="cs-student__head">
                            <div className="cs-student__face">
                                <i />
                                <i />
                            </div>
                        </div>
                        <div className="cs-student__body" />
                    </div>

                    <div className="cs-desk" />

                    {phase === 'ready' && (
                        <div className="cs-overlay">
                            <div className="cs-card">
                                <span className="cs-tag cs-tag--muted">课堂纪律</span>
                                <h1>上课摸鱼模拟器</h1>
                                <p>
                                    按住鼠标或空格键低头睡觉，摸鱼值会持续累积。
                                    <br />
                                    老师随时会转过身来，看到你在睡就完蛋了。
                                </p>
                                <button className="cs-btn" onClick={startGame}>
                                    开始上课
                                </button>
                            </div>
                        </div>
                    )}

                    {phase === 'over' && (
                        <div className="cs-overlay">
                            <div className="cs-card">
                                <span className="cs-tag">被抓包了</span>
                                <h1>老师转过身来了</h1>
                                <p>
                                    本次摸鱼值 <strong>{Math.floor(view.score)}</strong>
                                    <br />
                                    下次记得在他回头之前先醒过来。
                                </p>
                                <button className="cs-btn" onClick={startGame}>
                                    再来一次
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="cs-footer">
          <span className="cs-hint">
            按住鼠标 / 空格 睡觉 · 老师「转身」时松手
          </span>
                </div>
            </div>
        </div>
    );
}