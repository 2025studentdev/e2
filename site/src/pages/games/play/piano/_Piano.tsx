import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* ---------------- 常量 ---------------- */

const START_MIDI = 60; // C4
const END_MIDI = 84;   // C6
const BLACK_PCS = [1, 3, 6, 8, 10];
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const KEY_MAP: Record<string, number> = {
    a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
    k: 12, o: 13, l: 14, p: 15, ';': 16,
};

/* ---------------- 音频引擎 ---------------- */

type Voice = { out: GainNode; oscillators: OscillatorNode[] };

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let targetVolume = 0.6;

function ensureAudio(): AudioContext {
    if (!audioCtx) {
        const Ctor =
            window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new Ctor();

        const comp = audioCtx.createDynamicsCompressor();
        comp.threshold.value = -18;
        comp.knee.value = 24;
        comp.ratio.value = 6;
        comp.attack.value = 0.003;
        comp.release.value = 0.25;

        masterGain = audioCtx.createGain();
        masterGain.gain.value = targetVolume;
        masterGain.connect(comp);
        comp.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    return audioCtx;
}

function midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

const PARTIALS = [
    { ratio: 1, gain: 1.0, detune: 0 },
    { ratio: 2, gain: 0.42, detune: 4 },
    { ratio: 3, gain: 0.16, detune: -5 },
    { ratio: 4, gain: 0.08, detune: 6 },
    { ratio: 5, gain: 0.045, detune: -7 },
    { ratio: 6, gain: 0.025, detune: 9 },
];

function createVoice(midi: number): Voice {
    const ctx = ensureAudio();
    const now = ctx.currentTime;
    const freq = midiToFreq(midi);
    const decay = Math.max(1.5, 3.2 - (midi - START_MIDI) * 0.05);

    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(0.24, now + 0.006);
    out.gain.exponentialRampToValueAtTime(0.09, now + 0.16);
    out.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.5;
    filter.frequency.setValueAtTime(Math.min(freq * 16, 16000), now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 3, 400), now + decay * 0.5);
    filter.connect(out);
    if (masterGain) out.connect(masterGain);

    const oscillators: OscillatorNode[] = [];
    PARTIALS.forEach((p) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * p.ratio, now);
        osc.detune.setValueAtTime(p.detune, now);
        const g = ctx.createGain();
        g.gain.value = p.gain;
        osc.connect(g);
        g.connect(filter);
        osc.start(now);
        osc.stop(now + decay + 0.4);
        oscillators.push(osc);
    });

    oscillators[0].onended = () => {
        try { out.disconnect(); } catch { /* noop */ }
    };

    return { out, oscillators };
}

function releaseVoice(voice: Voice, fast: boolean): void {
    const ctx = ensureAudio();
    const t = ctx.currentTime;
    const g = voice.out.gain;
    const current = Math.max(g.value, 0.0001);
    g.cancelScheduledValues(t);
    g.setValueAtTime(current, t);
    g.exponentialRampToValueAtTime(0.0001, t + (fast ? 0.16 : 1.2));
}

/* ---------------- 工具 ---------------- */

function noteName(midi: number): string {
    return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

interface KeyDef {
    midi: number;
    isBlack: boolean;
    whiteIndex: number;
}

/* ---------------- 组件 ---------------- */

export default function Piano() {
    const keys = useMemo<KeyDef[]>(() => {
        const list: KeyDef[] = [];
        let wi = 0;
        for (let m = START_MIDI; m <= END_MIDI; m++) {
            const pc = ((m % 12) + 12) % 12;
            const isBlack = BLACK_PCS.includes(pc);
            list.push({ midi: m, isBlack, whiteIndex: wi });
            if (!isBlack) wi += 1;
        }
        return list;
    }, []);

    const totalWhite = useMemo(() => keys.filter((k) => !k.isBlack).length, [keys]);

    const [activeNotes, setActiveNotes] = useState<Set<number>>(() => new Set());
    const [sustain, setSustain] = useState(false);
    const [volume, setVolume] = useState(60);

    const voicesRef = useRef<Map<number, Voice>>(new Map());
    const sustainRef = useRef(false);
    const pointerDownRef = useRef(false);
    const slideRef = useRef<number | null>(null);
    const heldKeysRef = useRef<Map<string, number>>(new Map());

    useEffect(() => {
        sustainRef.current = sustain;
    }, [sustain]);

    useEffect(() => {
        targetVolume = volume / 100;
        if (masterGain && audioCtx) {
            masterGain.gain.value = targetVolume;
        }
    }, [volume]);

    const noteOn = useCallback((midi: number) => {
        const existing = voicesRef.current.get(midi);
        if (existing) {
            releaseVoice(existing, true);
            voicesRef.current.delete(midi);
        }
        const voice = createVoice(midi);
        voicesRef.current.set(midi, voice);

        setActiveNotes((prev) => (prev.has(midi) ? prev : new Set(prev).add(midi)));

        window.setTimeout(() => {
            if (voicesRef.current.get(midi) === voice) {
                voicesRef.current.delete(midi);
            }
        }, 4200);
    }, []);

    const noteOff = useCallback((midi: number) => {
        setActiveNotes((prev) => {
            if (!prev.has(midi)) return prev;
            const next = new Set(prev);
            next.delete(midi);
            return next;
        });

        const voice = voicesRef.current.get(midi);
        if (!voice) return;
        if (sustainRef.current) return; // 让声音自然衰减
        voicesRef.current.delete(midi);
        releaseVoice(voice, true);
    }, []);

    /* --- 指针（鼠标 / 触屏 / 滑奏） --- */

    const handleKeyDown = (midi: number) => {
        pointerDownRef.current = true;
        slideRef.current = midi;
        noteOn(midi);
    };

    const handleKeyboardMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!pointerDownRef.current) return;
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const target = el?.closest('[data-midi]') as HTMLElement | null;
        if (!target) return;
        const midi = Number(target.dataset.midi);
        if (Number.isNaN(midi) || midi === slideRef.current) return;
        const prev = slideRef.current;
        if (prev !== null) noteOff(prev);
        slideRef.current = midi;
        noteOn(midi);
    };

    useEffect(() => {
        const up = () => {
            pointerDownRef.current = false;
            if (slideRef.current !== null) {
                noteOff(slideRef.current);
                slideRef.current = null;
            }
        };
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
        window.addEventListener('blur', up);
        return () => {
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', up);
            window.removeEventListener('blur', up);
        };
    }, [noteOff]);

    /* --- 电脑键盘 --- */

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
            const key = e.key.toLowerCase();
            const semitone = KEY_MAP[key];
            if (semitone === undefined) return;
            const midi = START_MIDI + semitone;
            if (midi > END_MIDI) return;
            e.preventDefault();
            if (heldKeysRef.current.has(key)) return;
            heldKeysRef.current.set(key, midi);
            noteOn(midi);
        };
        const up = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const midi = heldKeysRef.current.get(key);
            if (midi === undefined) return;
            heldKeysRef.current.delete(key);
            noteOff(midi);
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
        };
    }, [noteOn, noteOff]);

    /* --- 卸载清理 --- */

    useEffect(() => {
        const voices = voicesRef.current;
        return () => {
            voices.forEach((v) => releaseVoice(v, true));
            voices.clear();
        };
    }, []);

    const activeNames = useMemo(
        () => Array.from(activeNotes).sort((a, b) => a - b).map(noteName),
        [activeNotes]
    );

    const whiteWidthPct = 100 / totalWhite;
    const blackWidthPct = whiteWidthPct * 0.62;

    return (
        <div className="pp-root">
            <header className="pp-header">
                <h1 className="pp-title">网页钢琴</h1>
                <p className="pp-subtitle">点击琴键或使用键盘字母演奏</p>
            </header>

            <section className="pp-shell">
                <div className="pp-toolbar">
                    <div className="pp-now">
                        <span className="pp-now-label">正在演奏</span>
                        <span className="pp-now-name">{activeNames.length ? activeNames.join(' · ') : '—'}</span>
                    </div>

                    <div className="pp-controls">
                        <button
                            type="button"
                            className="pp-toggle"
                            data-on={sustain}
                            onClick={() => setSustain((s) => !s)}
                        >
                            延音
                        </button>
                        <label className="pp-volume">
                            <span className="pp-volume-label">音量</span>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={volume}
                                onChange={(e) => setVolume(Number(e.target.value))}
                            />
                        </label>
                    </div>
                </div>

                <div className="pp-scroll">
                    <div
                        className="pp-keyboard"
                        onPointerMove={handleKeyboardMove}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        {keys.map((k) => {
                            const isActive = activeNotes.has(k.midi);

                            if (k.isBlack) {
                                const left = k.whiteIndex * whiteWidthPct - blackWidthPct / 2;
                                return (
                                    <div
                                        key={k.midi}
                                        data-midi={k.midi}
                                        className={`pp-key pp-key-black${isActive ? ' is-active' : ''}`}
                                        style={{ left: `${left}%`, width: `${blackWidthPct}%` }}
                                        onPointerDown={() => handleKeyDown(k.midi)}
                                    />
                                );
                            }

                            return (
                                <div
                                    key={k.midi}
                                    data-midi={k.midi}
                                    className={`pp-key pp-key-white${isActive ? ' is-active' : ''}`}
                                    onPointerDown={() => handleKeyDown(k.midi)}
                                >
                                    {k.midi % 12 === 0 && <span className="pp-key-label">{noteName(k.midi)}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="pp-hint">
                    <span>A S D F G H J K L ;</span>
                    <span className="pp-hint-dot" />
                    <span>W E T Y U O P</span>
                </div>
            </section>
        </div>
    );
}