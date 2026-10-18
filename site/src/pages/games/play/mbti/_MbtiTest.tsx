import { useEffect, useMemo, useRef, useState } from 'react';
import { DIMENSIONS, TYPES, shuffledQuestions, type Letter } from './_data';

type Stage = 'intro' | 'quiz' | 'result';

const QUESTIONS = shuffledQuestions();
const KEYS = ['A', 'B'];

export default function MbtiTest() {
    const [stage, setStage] = useState<Stage>('intro');
    const [index, setIndex] = useState(0);
    const [dir, setDir] = useState(1);
    const [barsOn, setBarsOn] = useState(false);
    const [copied, setCopied] = useState(false);
    const [answers, setAnswers] = useState<(Letter | null)[]>(() =>
        Array(QUESTIONS.length).fill(null)
    );
    const lock = useRef(false);
    const total = QUESTIONS.length;

    const answered = useMemo(() => answers.filter(Boolean).length, [answers]);

    const start = () => {
        setAnswers(Array(total).fill(null));
        setIndex(0);
        setDir(1);
        setCopied(false);
        setBarsOn(false);
        setStage('quiz');
    };

    const choose = (value: Letter) => {
        if (lock.current || stage !== 'quiz') return;
        lock.current = true;
        const next = answers.slice();
        next[index] = value;
        setAnswers(next);
        window.setTimeout(() => {
            lock.current = false;
            if (index === total - 1) setStage('result');
            else {
                setDir(1);
                setIndex((i) => i + 1);
            }
        }, 240);
    };

    const goBack = () => {
        if (index === 0 || lock.current) return;
        setDir(-1);
        setIndex((i) => i - 1);
    };

    const result = useMemo(() => {
        const counts: Record<Letter, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
        answers.forEach((a) => {
            if (a) counts[a] += 1;
        });
        const pick = (a: Letter, b: Letter) => (counts[a] >= counts[b] ? a : b);
        const type = `${pick('E', 'I')}${pick('S', 'N')}${pick('T', 'F')}${pick('J', 'P')}`;
        return { counts, type };
    }, [answers]);

    const info = TYPES[result.type];

    /* 结果页进度条动画触发 */
    useEffect(() => {
        if (stage !== 'result') return;
        const raf = requestAnimationFrame(() => setBarsOn(true));
        return () => cancelAnimationFrame(raf);
    }, [stage]);

    /* 键盘操作 */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (stage === 'intro') {
                if (e.key === 'Enter') start();
                return;
            }
            if (stage !== 'quiz') return;
            const q = QUESTIONS[index];
            const k = e.key.toLowerCase();
            if (k === 'a' || k === '1') choose(q.options[0].value);
            else if (k === 'b' || k === '2') choose(q.options[1].value);
            else if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
                e.preventDefault();
                goBack();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    const copyResult = async () => {
        const lines: string[] = [`我的 MBTI 类型：${result.type}（${info.name} · ${info.alias}）`];
        DIMENSIONS.forEach((d) => {
            const pair = result.counts[d.left] + result.counts[d.right];
            const leftPct = pair ? Math.round((result.counts[d.left] / pair) * 100) : 50;
            lines.push(`${d.leftLabel.replace(/ [EIJNPSTF]$/, '')} ${leftPct}% / ${100 - leftPct}% ${d.rightLabel.replace(/ [EIJNPSTF]$/, '')}`);
        });
        try {
            await navigator.clipboard.writeText(lines.join('\n'));
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            /* 剪贴板不可用时静默 */
        }
    };

    return (
        <div className="mbti-root">
            <div className="mbti-card">
                {stage === 'intro' && (
                    <section className="mbti-stage mbti-fade-up">
                        <p className="mbti-eyebrow">PERSONALITY&nbsp;ASSESSMENT</p>
                        <h1 className="mbti-title">MBTI 性格探索</h1>
                        <p className="mbti-desc">
                            28 道二选一问题，从四个维度描绘你的性格轮廓。
                            没有对错之分，请凭第一直觉作答，结果仅供自我探索参考。
                        </p>
                        <div className="mbti-meta">
                            <span>28 道选择题</span>
                            <span>约 5 分钟</span>
                            <span>支持键盘作答</span>
                        </div>
                        <button type="button" className="mbti-btn mbti-btn-primary" onClick={start}>
                            开始测试
                        </button>
                        <p className="mbti-hint">按 Enter 键也可开始</p>
                    </section>
                )}

                {stage === 'quiz' && (
                    <section className="mbti-stage">
                        <div className="mbti-topbar">
                            {index > 0 ? (
                                <button type="button" className="mbti-back" onClick={goBack}>
                                    ← 上一题
                                </button>
                            ) : (
                                <span className="mbti-back mbti-back-disabled">← 上一题</span>
                            )}
                            <span className="mbti-counter">
                第 <b>{index + 1}</b> 题 / 共 {total} 题
              </span>
                        </div>
                        <div className="mbti-progress" role="progressbar" aria-valuenow={answered} aria-valuemin={0} aria-valuemax={total}>
                            <div className="mbti-progress-fill" style={{ width: `${(answered / total) * 100}%` }} />
                        </div>

                        <div
                            key={index}
                            className={`mbti-qcard ${dir === 1 ? 'mbti-from-right' : 'mbti-from-left'}`}
                        >
                            <h2 className="mbti-question">{QUESTIONS[index].text}</h2>
                            <div className="mbti-options">
                                {QUESTIONS[index].options.map((opt, i) => {
                                    const selected = answers[index] === opt.value;
                                    return (
                                        <button
                                            key={KEYS[i]}
                                            type="button"
                                            className={`mbti-option${selected ? ' mbti-option-selected' : ''}`}
                                            onClick={() => choose(opt.value)}
                                        >
                                            <span className="mbti-key">{KEYS[i]}</span>
                                            <span className="mbti-option-text">{opt.label}</span>
                                            {selected && <span className="mbti-check">✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <p className="mbti-hint">按 A / B 或 1 / 2 键选择，Backspace 返回上一题</p>
                    </section>
                )}

                {stage === 'result' && (
                    <section className="mbti-stage mbti-fade-up">
                        <p className="mbti-eyebrow">YOUR&nbsp;RESULT</p>
                        <div className="mbti-type" aria-label={result.type}>
                            {result.type.split('').map((ch, i) => (
                                <span key={i} className="mbti-letter" style={{ animationDelay: `${i * 0.09}s` }}>
                  {ch}
                </span>
                            ))}
                        </div>
                        <h2 className="mbti-typename">
                            {info.name}
                            <span className="mbti-alias">{info.alias}</span>
                        </h2>
                        <p className="mbti-summary">{info.summary}</p>
                        <div className="mbti-traits">
                            {info.traits.map((t) => (
                                <span key={t} className="mbti-trait">{t}</span>
                            ))}
                        </div>

                        <div className="mbti-dims">
                            {DIMENSIONS.map((d) => {
                                const pair = result.counts[d.left] + result.counts[d.right];
                                const leftPct = pair ? Math.round((result.counts[d.left] / pair) * 100) : 50;
                                return (
                                    <div className="mbti-dim" key={d.left}>
                                        <div className="mbti-dim-head">
                      <span className={leftPct >= 50 ? 'mbti-strong' : ''}>
                        {d.leftLabel} · {leftPct}%
                      </span>
                                            <span className={leftPct < 50 ? 'mbti-strong' : ''}>
                        {100 - leftPct}% · {d.rightLabel}
                      </span>
                                        </div>
                                        <div className="mbti-track">
                                            <div
                                                className="mbti-fill"
                                                style={{ width: barsOn ? `${leftPct}%` : '50%' }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mbti-actions">
                            <button type="button" className="mbti-btn mbti-btn-primary" onClick={copyResult}>
                                {copied ? '已复制到剪贴板' : '复制我的结果'}
                            </button>
                            <button type="button" className="mbti-btn mbti-btn-ghost" onClick={start}>
                                重新测试
                            </button>
                        </div>
                        <p className="mbti-hint">结果由 28 道题的选项统计得出，仅供娱乐与自我探索参考</p>
                    </section>
                )}
            </div>
        </div>
    );
}