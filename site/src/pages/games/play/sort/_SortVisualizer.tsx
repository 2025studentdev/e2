import { useRef, useState } from 'react';

const SIZE = 20;
const MIN_VALUE = 8;
const MAX_VALUE = 100;
const CHART_HEIGHT = 240;

const C = {
    idle: '#dbe1e8',
    compare: '#e0a33a',
    swap: '#c25c4b',
    sorted: '#2f4a63',
};

/* ---------------- 数据 ---------------- */

function randomData(): number[] {
    return Array.from({ length: SIZE }, () =>
        Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)) + MIN_VALUE
    );
}

/* ---------------- 帧结构 ---------------- */

type Frame = {
    array: number[];
    compare: number[];
    swap: number[];
    sorted: number[];
};

function snapshot(
    a: number[],
    compare: number[],
    swap: number[],
    sorted: Set<number>
): Frame {
    return { array: a.slice(), compare, swap, sorted: Array.from(sorted) };
}

/* ---------------- 算法生成器 ---------------- */

function* bubbleSort(input: number[]): Generator<Frame> {
    const a = input.slice();
    const n = a.length;
    const sorted = new Set<number>();

    for (let i = 0; i < n - 1; i++) {
        let swapped = false;
        for (let j = 0; j < n - 1 - i; j++) {
            yield snapshot(a, [j, j + 1], [], sorted);
            if (a[j] > a[j + 1]) {
                const t = a[j];
                a[j] = a[j + 1];
                a[j + 1] = t;
                yield snapshot(a, [], [j, j + 1], sorted);
                swapped = true;
            }
        }
        sorted.add(n - 1 - i);
        if (!swapped) break;
    }
    for (let i = 0; i < n; i++) sorted.add(i);
    yield snapshot(a, [], [], sorted);
}

function* selectionSort(input: number[]): Generator<Frame> {
    const a = input.slice();
    const n = a.length;
    const sorted = new Set<number>();

    for (let i = 0; i < n - 1; i++) {
        let min = i;
        for (let j = i + 1; j < n; j++) {
            yield snapshot(a, [min, j], [], sorted);
            if (a[j] < a[min]) min = j;
        }
        if (min !== i) {
            const t = a[i];
            a[i] = a[min];
            a[min] = t;
            yield snapshot(a, [], [i, min], sorted);
        }
        sorted.add(i);
    }
    for (let i = 0; i < n; i++) sorted.add(i);
    yield snapshot(a, [], [], sorted);
}

function* insertionSort(input: number[]): Generator<Frame> {
    const a = input.slice();
    const n = a.length;
    const sorted = new Set<number>();

    for (let i = 1; i < n; i++) {
        let j = i;
        while (j > 0) {
            yield snapshot(a, [j - 1, j], [], sorted);
            if (a[j - 1] > a[j]) {
                const t = a[j - 1];
                a[j - 1] = a[j];
                a[j] = t;
                yield snapshot(a, [], [j - 1, j], sorted);
                j--;
            } else {
                break;
            }
        }
    }
    for (let i = 0; i < n; i++) sorted.add(i);
    yield snapshot(a, [], [], sorted);
}

function* quickSort(input: number[]): Generator<Frame> {
    const a = input.slice();
    const sorted = new Set<number>();

    function* sort(lo: number, hi: number): Generator<Frame> {
        if (lo >= hi) {
            if (lo === hi) sorted.add(lo);
            return;
        }
        const pivot = a[hi];
        let i = lo;
        for (let j = lo; j < hi; j++) {
            yield snapshot(a, [j, hi], [], sorted);
            if (a[j] < pivot) {
                if (i !== j) {
                    const t = a[i];
                    a[i] = a[j];
                    a[j] = t;
                    yield snapshot(a, [], [i, j], sorted);
                }
                i++;
            }
        }
        if (i !== hi) {
            const t = a[i];
            a[i] = a[hi];
            a[hi] = t;
            yield snapshot(a, [], [i, hi], sorted);
        }
        sorted.add(i);
        yield* sort(lo, i - 1);
        yield* sort(i + 1, hi);
    }

    yield* sort(0, a.length - 1);
    for (let i = 0; i < a.length; i++) sorted.add(i);
    yield snapshot(a, [], [], sorted);
}

/* ---------------- 算法表 ---------------- */

const ALGOS = [
    { key: 'bubble', label: '冒泡排序', run: bubbleSort },
    { key: 'selection', label: '选择排序', run: selectionSort },
    { key: 'insertion', label: '插入排序', run: insertionSort },
    { key: 'quick', label: '快速排序', run: quickSort },
] as const;

type AlgoKey = (typeof ALGOS)[number]['key'];
type Phase = 'idle' | 'running' | 'done';

function speedToDelay(v: number): number {
    return Math.round(280 * Math.pow(0.035, (v - 1) / 99));
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ---------------- 组件 ---------------- */

export default function SortVisualizer() {
    const [data, setData] = useState<number[]>(randomData);
    const [array, setArray] = useState<number[]>(data);
    const [compareIdx, setCompareIdx] = useState<number[]>([]);
    const [swapIdx, setSwapIdx] = useState<number[]>([]);
    const [sortedIdx, setSortedIdx] = useState<number[]>([]);
    const [algo, setAlgo] = useState<AlgoKey>('bubble');
    const [speed, setSpeed] = useState(72);
    const [running, setRunning] = useState(false);
    const [phase, setPhase] = useState<Phase>('idle');
    const [stats, setStats] = useState({ compares: 0, swaps: 0, elapsed: 0 });

    const delayRef = useRef(speedToDelay(72));
    const activeRef = useRef(false);

    const maxVal = Math.max(...array, 1);
    const phaseLabel =
        phase === 'running' ? '运行中' : phase === 'done' ? '已完成' : '就绪';

    const handleShuffle = () => {
        if (activeRef.current) return;
        const next = randomData();
        setData(next);
        setArray(next);
        setCompareIdx([]);
        setSwapIdx([]);
        setSortedIdx([]);
        setStats({ compares: 0, swaps: 0, elapsed: 0 });
        setPhase('idle');
    };

    const handleStop = () => {
        activeRef.current = false;
        setRunning(false);
    };

    const handleStart = async () => {
        if (activeRef.current) return;
        activeRef.current = true;
        setRunning(true);
        setPhase('running');
        setCompareIdx([]);
        setSwapIdx([]);
        setSortedIdx([]);
        setStats({ compares: 0, swaps: 0, elapsed: 0 });

        const def = ALGOS.find((a) => a.key === algo);
        if (!def) return;

        const gen = def.run(data);
        const t0 = performance.now();
        let compares = 0;
        let swaps = 0;

        const ticker = window.setInterval(() => {
            setStats((s) => ({ ...s, elapsed: performance.now() - t0 }));
        }, 97);

        for (const frame of gen) {
            if (!activeRef.current) break;
            if (frame.compare.length) compares++;
            if (frame.swap.length) swaps++;
            setArray(frame.array);
            setCompareIdx(frame.compare);
            setSwapIdx(frame.swap);
            setSortedIdx(frame.sorted);
            setStats({ compares, swaps, elapsed: performance.now() - t0 });
            await sleep(delayRef.current);
        }

        window.clearInterval(ticker);
        const completed = activeRef.current;
        activeRef.current = false;
        setRunning(false);
        setCompareIdx([]);
        setSwapIdx([]);
        setStats((s) => ({ ...s, elapsed: performance.now() - t0 }));
        setPhase(completed ? 'done' : 'idle');
    };

    return (
        <div className="sv-root">
            <style>{CSS}</style>

            <div className="sv-inner">
                <header className="sv-header">
                    <h1 className="sv-title">排序算法可视化</h1>
                    <p className="sv-subtitle">
                        随机生成 20 个数据，选择一种算法后点击开始，逐步观察元素的比较与交换过程。
                    </p>
                </header>

                <section className="sv-toolbar">
                    <div className="sv-field">
                        <span className="sv-label">算法</span>
                        <div className="sv-tabs">
                            {ALGOS.map((a) => (
                                <button
                                    key={a.key}
                                    type="button"
                                    className={'sv-tab' + (algo === a.key ? ' is-active' : '')}
                                    onClick={() => setAlgo(a.key)}
                                    disabled={running}
                                >
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="sv-field">
                        <span className="sv-label">速度</span>
                        <div className="sv-speed">
                            <input
                                type="range"
                                min={1}
                                max={100}
                                value={speed}
                                className="sv-range"
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    setSpeed(v);
                                    delayRef.current = speedToDelay(v);
                                }}
                            />
                            <span className="sv-speed-value">{speed}</span>
                        </div>
                    </div>

                    <div className="sv-actions">
                        <button
                            type="button"
                            className="sv-btn"
                            onClick={handleShuffle}
                            disabled={running}
                        >
                            重新生成
                        </button>
                        {running ? (
                            <button
                                type="button"
                                className="sv-btn sv-btn--primary"
                                onClick={handleStop}
                            >
                                停止
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="sv-btn sv-btn--primary"
                                onClick={handleStart}
                            >
                                开始排序
                            </button>
                        )}
                    </div>
                </section>

                <section className="sv-chart-card">
                    <div className="sv-chart">
                        {array.map((v, i) => {
                            const h = Math.max(6, (v / maxVal) * CHART_HEIGHT);
                            const bg = swapIdx.includes(i)
                                ? C.swap
                                : compareIdx.includes(i)
                                    ? C.compare
                                    : sortedIdx.includes(i)
                                        ? C.sorted
                                        : C.idle;
                            return (
                                <div className="sv-col" key={i}>
                                    <div className="sv-bar" style={{ height: h, background: bg }} />
                                    <span className="sv-val">{v}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="sv-meta">
                        <div className="sv-legend">
              <span className="sv-legend-item">
                <i className="sv-dot" style={{ background: C.idle }} />
                待排序
              </span>
                            <span className="sv-legend-item">
                <i className="sv-dot" style={{ background: C.compare }} />
                比较中
              </span>
                            <span className="sv-legend-item">
                <i className="sv-dot" style={{ background: C.swap }} />
                交换中
              </span>
                            <span className="sv-legend-item">
                <i className="sv-dot" style={{ background: C.sorted }} />
                已就位
              </span>
                        </div>

                        <div className="sv-stats">
                            <div className="sv-stat">
                                <span className="sv-stat-label">比较</span>
                                <span className="sv-stat-value">{stats.compares}</span>
                            </div>
                            <div className="sv-stat">
                                <span className="sv-stat-label">交换</span>
                                <span className="sv-stat-value">{stats.swaps}</span>
                            </div>
                            <div className="sv-stat">
                                <span className="sv-stat-label">耗时</span>
                                <span className="sv-stat-value">
                  {(stats.elapsed / 1000).toFixed(2)}s
                </span>
                            </div>
                            <div className="sv-stat">
                                <span className="sv-stat-label">状态</span>
                                <span className="sv-stat-value">{phaseLabel}</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

/* ---------------- 样式 ---------------- */

const CSS = `
.sv-root {
  --ink: #1b2430;
  --muted: #6b7684;
  --line: #e4e8ed;
  --surface: #ffffff;
  min-height: 100vh;
  padding: 56px 24px 80px;
  background: #f7f8fa;
  color: var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}
.sv-root *, .sv-root *::before, .sv-root *::after { box-sizing: border-box; }

.sv-inner { max-width: 1000px; margin: 0 auto; }

.sv-header { margin-bottom: 26px; }
.sv-title {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.sv-subtitle {
  margin: 0;
  font-size: 14px;
  line-height: 1.65;
  color: var(--muted);
}

.sv-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 20px 28px;
  padding: 18px 20px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
}

.sv-field { display: flex; flex-direction: column; gap: 9px; }
.sv-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #98a3b0;
}

.sv-tabs {
  display: inline-flex;
  padding: 3px;
  gap: 2px;
  background: #eef1f5;
  border-radius: 10px;
}
.sv-tab {
  border: 0;
  background: transparent;
  padding: 7px 14px;
  font-size: 13px;
  font-family: inherit;
  color: var(--muted);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color .18s ease, color .18s ease, box-shadow .18s ease;
}
.sv-tab:hover:not(:disabled):not(.is-active) { color: var(--ink); }
.sv-tab.is-active {
  background: #fff;
  color: var(--ink);
  box-shadow: 0 1px 2px rgba(16, 24, 40, .09);
}
.sv-tab:disabled { cursor: not-allowed; opacity: .55; }

.sv-speed { display: flex; align-items: center; gap: 12px; }
.sv-range {
  -webkit-appearance: none;
  appearance: none;
  width: 150px;
  height: 4px;
  border-radius: 2px;
  background: #e4e8ed;
  outline: none;
  cursor: pointer;
}
.sv-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #2f4a63;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #cbd3dc;
  cursor: pointer;
}
.sv-range::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #2f4a63;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #cbd3dc;
  cursor: pointer;
}
.sv-speed-value {
  min-width: 26px;
  font-size: 12px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.sv-actions { display: flex; gap: 10px; margin-left: auto; }

.sv-btn {
  height: 38px;
  padding: 0 18px;
  font-size: 13px;
  font-family: inherit;
  color: var(--ink);
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 9px;
  cursor: pointer;
  transition: background-color .18s ease, border-color .18s ease, opacity .18s ease;
}
.sv-btn:hover:not(:disabled) { background: #fafbfc; border-color: #c9d2dc; }
.sv-btn:disabled { opacity: .45; cursor: not-allowed; }
.sv-btn--primary {
  background: #2f4a63;
  border-color: #2f4a63;
  color: #fff;
}
.sv-btn--primary:hover:not(:disabled) {
  background: #263c51;
  border-color: #263c51;
}

.sv-chart-card {
  margin-top: 18px;
  padding: 26px 20px 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
}

.sv-chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 280px;
}
.sv-col {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 7px;
  height: 100%;
}
.sv-bar {
  width: 100%;
  border-radius: 3px 3px 0 0;
  transition: background-color .12s linear, height .09s ease;
  will-change: height;
}
.sv-col:hover .sv-bar { filter: brightness(.94); }
.sv-val {
  font-size: 10px;
  line-height: 1;
  color: #9aa5b1;
  font-variant-numeric: tabular-nums;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.sv-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}
.sv-legend { display: flex; flex-wrap: wrap; gap: 18px; }
.sv-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--muted);
}
.sv-dot { width: 10px; height: 10px; border-radius: 3px; }

.sv-stats { display: flex; gap: 28px; }
.sv-stat { display: flex; flex-direction: column; gap: 3px; }
.sv-stat-label { font-size: 11px; color: #98a3b0; }
.sv-stat-value {
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

@media (max-width: 720px) {
  .sv-root { padding: 36px 16px 56px; }
  .sv-actions { margin-left: 0; width: 100%; }
  .sv-btn { flex: 1; }
  .sv-stats { gap: 20px; flex-wrap: wrap; }
  .sv-chart { gap: 4px; }
}
`;