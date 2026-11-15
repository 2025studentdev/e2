// src/pages/games/play/color/_colors.ts
export type RGB = { r: number; g: number; b: number };
export type HSL = { h: number; s: number; l: number };

/** HSL -> HEX */
export function hslToHex(h: number, s: number, l: number): string {
    const sn = s / 100;
    const ln = l / 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = sn * Math.min(ln, 1 - ln);
    const f = (n: number) =>
        ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const to = (x: number) =>
        Math.round(Math.max(0, Math.min(1, x)) * 255)
            .toString(16)
            .padStart(2, '0');
    return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}

/** 归一化用户输入的色号，非法返回 null */
export function normalizeHex(input: string): string | null {
    const raw = input.trim().replace(/^#+/, '');
    if (/^[0-9a-f]{3}$/i.test(raw)) {
        return (
            '#' +
            raw
                .split('')
                .map((c) => c + c)
                .join('')
                .toLowerCase()
        );
    }
    if (/^[0-9a-f]{6}$/i.test(raw)) {
        return '#' + raw.toLowerCase();
    }
    return null;
}

export function hexToRgb(hex: string): RGB {
    const v = hex.replace('#', '');
    return {
        r: parseInt(v.slice(0, 2), 16),
        g: parseInt(v.slice(2, 4), 16),
        b: parseInt(v.slice(4, 6), 16),
    };
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case rn:
                h = (gn - bn) / d + (gn < bn ? 6 : 0);
                break;
            case gn:
                h = (bn - rn) / d + 2;
                break;
            default:
                h = (rn - gn) / d + 4;
        }
        h *= 60;
    }

    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function channel(v: number): number {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string): number {
    const { r, g, b } = hexToRgb(hex);
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** 在该颜色上可读性最好的文字颜色 */
export function bestTextOn(hex: string): string {
    return contrastRatio(hex, '#ffffff') >= contrastRatio(hex, '#111111')
        ? '#ffffff'
        : '#111111';
}

/** 色相族 */
export const HUE_FAMILIES = [
    { hue: 0, name: '红' },
    { hue: 25, name: '橙' },
    { hue: 45, name: '黄' },
    { hue: 80, name: '黄绿' },
    { hue: 120, name: '绿' },
    { hue: 155, name: '青绿' },
    { hue: 185, name: '青' },
    { hue: 210, name: '天蓝' },
    { hue: 230, name: '蓝' },
    { hue: 265, name: '靛紫' },
    { hue: 300, name: '品红' },
    { hue: 330, name: '玫红' },
];

/** 明度阶梯 */
export const LEVELS = [18, 30, 42, 52, 62, 72, 82, 92];

export const SATURATION = 72;

/** 构造色板行：12 个色相族 + 1 行中性色 */
export function buildRows(): string[][] {
    const rows = HUE_FAMILIES.map((f) =>
        LEVELS.map((l) => hslToHex(f.hue, SATURATION, l)),
    );
    rows.push(LEVELS.map((l) => hslToHex(220, 8, l)));
    return rows;
}

/** 默认选中色：与色板中「蓝 · L52」完全一致 */
export const DEFAULT_COLOR = hslToHex(230, SATURATION, 52);