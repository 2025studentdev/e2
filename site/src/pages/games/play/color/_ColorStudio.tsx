// src/pages/games/play/color/_ColorStudio.tsx
import { useCallback, useMemo, useState } from 'react';
import { ColorGrid } from './_ColorGrid';
import { ColorPanel } from './_ColorPanel';
import { DEFAULT_COLOR, buildRows, normalizeHex } from './_colors';

export default function ColorStudio() {
    const rows = useMemo(() => buildRows(), []);

    const [color, setColor] = useState<string>(DEFAULT_COLOR);
    const [input, setInput] = useState<string>(DEFAULT_COLOR);
    const [history, setHistory] = useState<string[]>([]);

    /** 点选 / 提交：更新颜色、输入框、历史 */
    const applyColor = useCallback((hex: string) => {
        setColor(hex);
        setInput(hex);
        setHistory((prev) => [hex, ...prev.filter((c) => c !== hex)].slice(0, 12));
    }, []);

    /** 输入即预览 */
    const handleInput = useCallback((value: string) => {
        setInput(value);
        const next = normalizeHex(value);
        if (next) setColor(next);
    }, []);

    const handleSubmit = useCallback(() => {
        const next = normalizeHex(input);
        if (next) applyColor(next);
    }, [input, applyColor]);

    const inputValid = useMemo(() => normalizeHex(input) !== null, [input]);

    return (
        <div className="cp-root">
            <div className="cp-shell">
                <header className="cp-header">
                    <h1 className="cp-title">调色盘</h1>
                    <p className="cp-sub">点击色块选择颜色，或直接输入十六进制色号预览</p>
                </header>

                <div className="cp-layout">
                    <section className="cp-card cp-card--grid">
                        <ColorGrid rows={rows} active={color} onSelect={applyColor} />
                    </section>

                    <section className="cp-card cp-card--panel">
                        <ColorPanel
                            color={color}
                            input={input}
                            inputValid={inputValid}
                            history={history}
                            onInput={handleInput}
                            onSubmit={handleSubmit}
                            onPick={applyColor}
                        />
                    </section>
                </div>
            </div>
        </div>
    );
}