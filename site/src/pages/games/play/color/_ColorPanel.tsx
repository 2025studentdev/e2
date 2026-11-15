// src/pages/games/play/color/_ColorPanel.tsx
import { bestTextOn, hexToRgb, rgbToHsl } from './_colors';

type ColorPanelProps = {
    color: string;
    input: string;
    inputValid: boolean;
    history: string[];
    onInput: (value: string) => void;
    onSubmit: () => void;
    onPick: (hex: string) => void;
};

export function ColorPanel({
                               color,
                               input,
                               inputValid,
                               history,
                               onInput,
                               onSubmit,
                               onPick,
                           }: ColorPanelProps) {
    const rgb = hexToRgb(color);
    const hsl = rgbToHsl(rgb);
    const textColor = bestTextOn(color);

    const isEmpty = input.trim().replace(/^#+/, '') === '';
    const showError = !isEmpty && !inputValid;

    const hint = isEmpty
        ? '输入色号，例如 #3B82F6'
        : inputValid
            ? '按回车或点击「应用」预览'
            : '色号格式有误，请输入例如 #3B82F6 的格式';

    return (
        <div className="cp-panel">
            <div className="cp-preview" style={{ backgroundColor: color }}>
                <div className="cp-preview-inner" style={{ color: textColor }}>
                    <span className="cp-preview-label">当前色号</span>
                    <span className="cp-preview-hex">{color.toUpperCase()}</span>
                </div>
            </div>

            <div className="cp-values">
                <div className="cp-value-row">
                    <span className="cp-value-label">HEX</span>
                    <span className="cp-value-text">{color.toUpperCase()}</span>
                </div>
                <div className="cp-value-row">
                    <span className="cp-value-label">RGB</span>
                    <span className="cp-value-text">
            {rgb.r}, {rgb.g}, {rgb.b}
          </span>
                </div>
                <div className="cp-value-row">
                    <span className="cp-value-label">HSL</span>
                    <span className="cp-value-text">
            {hsl.h}°, {hsl.s}%, {hsl.l}%
          </span>
                </div>
            </div>

            <div className="cp-block">
                <span className="cp-block-title">输入色号</span>
                <form
                    className="cp-field"
                    data-invalid={showError ? 'true' : 'false'}
                    onSubmit={(event) => {
                        event.preventDefault();
                        onSubmit();
                    }}
                >
                    <input
                        className="cp-input"
                        value={input}
                        onChange={(event) => onInput(event.target.value)}
                        placeholder="#3B82F6"
                        spellCheck={false}
                        autoComplete="off"
                        autoCapitalize="characters"
                        aria-label="十六进制色号"
                        maxLength={7}
                    />
                    <button className="cp-apply" type="submit" disabled={!inputValid}>
                        应用
                    </button>
                </form>
                <p className="cp-hint" data-invalid={showError ? 'true' : 'false'}>
                    {hint}
                </p>
            </div>

            {history.length > 0 && (
                <div className="cp-block">
                    <span className="cp-block-title">最近使用</span>
                    <div className="cp-history">
                        {history.map((hex) => (
                            <button
                                key={hex}
                                type="button"
                                className="cp-history-swatch"
                                style={{ backgroundColor: hex }}
                                aria-label={hex.toUpperCase()}
                                title={hex.toUpperCase()}
                                onClick={() => onPick(hex)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}