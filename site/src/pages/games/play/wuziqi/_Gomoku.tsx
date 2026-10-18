import { useRef, useState } from "react";

const SIZE = 15;
const LAST = SIZE - 1;

const STAR_POINTS: Array<[number, number]> = [
    [3, 3],
    [3, 11],
    [11, 3],
    [11, 11],
    [7, 7],
];

const DIRECTIONS: Array<[number, number]> = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
];

type Player = 1 | 2;
type Cell = 0 | Player;
type Point = { r: number; c: number };
type Stone = Point & { player: Player };

function createBoard(): Cell[][] {
    return Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(0));
}

/** 判断刚落下的这一子是否形成五连，返回连成一线的坐标（按顺序） */
function findWinningLine(
    board: Cell[][],
    r: number,
    c: number,
    player: Player
): Point[] | null {
    for (const [dr, dc] of DIRECTIONS) {
        const cells: Point[] = [{ r, c }];

        for (let i = 1; i < 5; i += 1) {
            const nr = r + dr * i;
            const nc = c + dc * i;
            if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) break;
            if (board[nr][nc] !== player) break;
            cells.push({ r: nr, c: nc });
        }

        for (let i = 1; i < 5; i += 1) {
            const nr = r - dr * i;
            const nc = c - dc * i;
            if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) break;
            if (board[nr][nc] !== player) break;
            cells.unshift({ r: nr, c: nc });
        }

        if (cells.length >= 5) return cells;
    }
    return null;
}

export default function Gomoku() {
    const [board, setBoard] = useState<Cell[][]>(createBoard);
    const [history, setHistory] = useState<Stone[]>([]);
    const [winLine, setWinLine] = useState<Point[] | null>(null);
    const [winner, setWinner] = useState<Player | null>(null);
    const [hover, setHover] = useState<Point | null>(null);

    const gridRef = useRef<HTMLDivElement>(null);

    const current: Player = history.length % 2 === 0 ? 1 : 2;
    const lastStone = history.length > 0 ? history[history.length - 1] : null;
    const blackCount = history.filter((s) => s.player === 1).length;
    const whiteCount = history.length - blackCount;
    const isDraw = winner === null && history.length === SIZE * SIZE;

    /** 把屏幕坐标换算成最近的交叉点 */
    function locate(clientX: number, clientY: number): Point | null {
        const el = gridRef.current;
        if (!el) return null;

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null;

        const fx = (clientX - rect.left) / rect.width;
        const fy = (clientY - rect.top) / rect.height;

        const c = Math.round(fx * LAST);
        const r = Math.round(fy * LAST);
        if (r < 0 || r > LAST || c < 0 || c > LAST) return null;

        const cell = rect.width / LAST;
        const dist = Math.hypot(fx * LAST - c, fy * LAST - r) * cell;
        if (dist > cell * 0.7) return null;

        return { r, c };
    }

    function place(r: number, c: number) {
        if (winner !== null) return;
        if (board[r][c] !== 0) return;

        const player = current;
        const next = board.map((row) => row.slice());
        next[r][c] = player;

        const line = findWinningLine(next, r, c, player);

        setBoard(next);
        setHistory((h) => [...h, { r, c, player }]);
        setHover(null);

        if (line) {
            setWinLine(line);
            setWinner(player);
        }
    }

    function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
        if (winner !== null) {
            if (hover) setHover(null);
            return;
        }
        if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;

        const p = locate(e.clientX, e.clientY);
        if (!p || board[p.r][p.c] !== 0) {
            if (hover) setHover(null);
            return;
        }
        if (!hover || hover.r !== p.r || hover.c !== p.c) setHover(p);
    }

    function handlePointerLeave() {
        if (hover) setHover(null);
    }

    function handleClick(e: React.MouseEvent<HTMLDivElement>) {
        const p = locate(e.clientX, e.clientY);
        if (p) place(p.r, p.c);
    }

    function undo() {
        if (history.length === 0) return;

        const last = history[history.length - 1];
        const next = board.map((row) => row.slice());
        next[last.r][last.c] = 0;

        setBoard(next);
        setHistory((h) => h.slice(0, -1));
        setWinLine(null);
        setWinner(null);
        setHover(null);
    }

    function reset() {
        setBoard(createBoard());
        setHistory([]);
        setWinLine(null);
        setWinner(null);
        setHover(null);
    }

    const ghostVisible =
        hover !== null && winner === null && board[hover.r][hover.c] === 0;

    const winStart = winLine ? winLine[0] : null;
    const winEnd = winLine ? winLine[winLine.length - 1] : null;

    return (
        <div className="gk-app">
            <header className="gk-header">
                <div className="gk-header-mark" aria-hidden="true">
                    <span className="gk-header-dot gk-header-dot--black" />
                    <span className="gk-header-dot gk-header-dot--white" />
                </div>
                <div>
                    <h1>五子棋</h1>
                    <p>十五路棋盘 · 本地双人对弈</p>
                </div>
            </header>

            <div className="gk-board-col">
                <div className={`gk-board${winner ? " gk-board--finished" : ""}`}>
                    <div
                        className="gk-grid"
                        ref={gridRef}
                        onPointerMove={handlePointerMove}
                        onPointerLeave={handlePointerLeave}
                        onClick={handleClick}
                        role="grid"
                        aria-label="五子棋棋盘"
                    >
                        <svg
                            className="gk-lines"
                            viewBox={`0 0 ${LAST} ${LAST}`}
                            preserveAspectRatio="none"
                            aria-hidden="true"
                        >
                            {Array.from({ length: SIZE }, (_, i) => (
                                <g key={i}>
                                    <line
                                        x1={0}
                                        y1={i}
                                        x2={LAST}
                                        y2={i}
                                        vectorEffect="non-scaling-stroke"
                                    />
                                    <line
                                        x1={i}
                                        y1={0}
                                        x2={i}
                                        y2={LAST}
                                        vectorEffect="non-scaling-stroke"
                                    />
                                </g>
                            ))}
                            {STAR_POINTS.map(([r, c]) => (
                                <circle key={`${r}-${c}`} cx={c} cy={r} r={0.11} />
                            ))}
                        </svg>

                        {winStart && winEnd && (
                            <svg
                                className="gk-winline"
                                viewBox={`0 0 ${LAST} ${LAST}`}
                                preserveAspectRatio="none"
                                aria-hidden="true"
                            >
                                <line
                                    x1={winStart.c}
                                    y1={winStart.r}
                                    x2={winEnd.c}
                                    y2={winEnd.r}
                                    strokeWidth={4}
                                    strokeLinecap="round"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </svg>
                        )}

                        {history.map((s, idx) => {
                            const isLast = idx === history.length - 1;
                            return (
                                <div
                                    key={`${s.r}-${s.c}`}
                                    className={`gk-stone${isLast ? " gk-stone--last" : ""}`}
                                    style={{
                                        left: `${(s.c / LAST) * 100}%`,
                                        top: `${(s.r / LAST) * 100}%`,
                                    }}
                                >
                  <span
                      className={`gk-stone-body gk-stone-body--${
                          s.player === 1 ? "black" : "white"
                      }`}
                  />
                                </div>
                            );
                        })}

                        {ghostVisible && hover && (
                            <div
                                className="gk-stone gk-stone--ghost"
                                style={{
                                    left: `${(hover.c / LAST) * 100}%`,
                                    top: `${(hover.r / LAST) * 100}%`,
                                }}
                            >
                <span
                    className={`gk-stone-body gk-stone-body--${
                        current === 1 ? "black" : "white"
                    }`}
                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <aside className="gk-panel" aria-live="polite">
                <div className="gk-turn">
          <span
              className={`gk-turn-stone gk-stone-body gk-stone-body--${
                  winner === 2 || (winner === null && current === 2)
                      ? "white"
                      : "black"
              }`}
          />
                    <div className="gk-turn-text">
            <span className="gk-turn-label">
              {winner !== null ? "对局结束" : isDraw ? "和棋" : "当前回合"}
            </span>
                        <strong className="gk-turn-name">
                            {winner !== null
                                ? `${winner === 1 ? "黑棋" : "白棋"}获胜`
                                : isDraw
                                    ? "棋盘已满"
                                    : current === 1
                                        ? "黑棋"
                                        : "白棋"}
                        </strong>
                    </div>
                </div>

                <dl className="gk-stats">
                    <div>
                        <dt>总步数</dt>
                        <dd>{history.length}</dd>
                    </div>
                    <div>
                        <dt>黑棋</dt>
                        <dd>{blackCount}</dd>
                    </div>
                    <div>
                        <dt>白棋</dt>
                        <dd>{whiteCount}</dd>
                    </div>
                </dl>

                <div className="gk-actions">
                    <button
                        type="button"
                        className="gk-btn"
                        onClick={undo}
                        disabled={history.length === 0}
                    >
                        悔棋
                    </button>
                    <button
                        type="button"
                        className="gk-btn gk-btn--primary"
                        onClick={reset}
                        disabled={history.length === 0 && winner === null}
                    >
                        重新开始
                    </button>
                </div>

                <p className="gk-hint">
                    {lastStone
                        ? `最后落子：第 ${lastStone.c + 1} 列 / 第 ${lastStone.r + 1} 行`
                        : "点击棋盘交叉点落子"}
                </p>
            </aside>
        </div>
    );
}