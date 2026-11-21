import * as React from 'react';

const FLOATERS = [
    '0.30004', '2147483647', '0x7FFFFF', '</>', '0xDEADBEEF', '∞',
    '2³¹−1', 'NaN', '{ }', '1e308', '0b1010', 'NULL', '0.1 + 0.2',
    '//', '0x7FFFFFFF', '&&', 'return', 'INT32_MAX', 'e^{iπ}+1=0', '01',
    '0xFF', 'true', 'while(1)', '::', '0x00',
];

const AboutApp: React.FC = () => {
    const floaters = React.useMemo(
        () =>
            FLOATERS.map((text, i) => {
                const s = (n: number) => ((i + 1) * n) % 100;
                return {
                    text,
                    left: `${(s(37) + i * 2) % 96}%`,
                    top: `${(s(53) + i * 3) % 92}%`,
                    fontSize: `${11 + (s(7) % 24)}px`,
                    duration: `${18 + (s(11) % 16)}s`,
                    delay: `-${s(13) % 26}s`,
                    opacity: 0.06 + (s(3) % 9) / 100,
                };
            }),
        []
    );

    return (
        <div className="about-app">
            <div className="bg-grid" aria-hidden="true" />
            <div className="bg-glow" aria-hidden="true" />

            <div className="floaters" aria-hidden="true">
                {floaters.map((f, i) => (
                    <span
                        key={i}
                        className="floater"
                        style={{
                            left: f.left,
                            top: f.top,
                            fontSize: f.fontSize,
                            animationDuration: f.duration,
                            animationDelay: f.delay,
                            opacity: f.opacity,
                        }}
                    >
            {f.text}
          </span>
                ))}
            </div>

            <main className="container">
                <p className="eyebrow">// BEYOND THE DIGITAL BOUNDARY</p>

                <h1 className="title">E2147dev</h1>
                <p className="tagline">超越数字世界的边界</p>

                <div className="divider" aria-hidden="true" />

                <ul className="list">
                    <li>
                        <span className="key">E</span>
                        <span className="text">Electronic — 电子的</span>
                    </li>
                    <li>
                        <span className="key">2147</span>
                        <span className="text">2³¹ − 1 · INT32_MAX</span>
                    </li>
                    <li>
                        <span className="key">dev</span>
                        <span className="text">Developer</span>
                    </li>
                </ul>

                <a className="links" href="/links">
                    <span>友情链接</span>
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                    </svg>
                </a>

                <footer className="footer">
                    <span className="status-dot" aria-hidden="true" />
                    <span>SYSTEM ONLINE · © {new Date().getFullYear()} E2147dev</span>
                </footer>
            </main>

            <style>{`
        .about-app {
          position: relative;
          min-height: 100vh;
          background: #05070d;
          color: #e6edf6;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
          display: grid;
          place-items: center;
          padding: 64px 24px;
          overflow: hidden;
          isolation: isolate;
        }

        /* ---------- 背景层 ---------- */

        .bg-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(88, 166, 255, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(88, 166, 255, 0.06) 1px, transparent 1px);
          background-size: 56px 56px;
          -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 45%, #000 30%, transparent 78%);
          mask-image: radial-gradient(ellipse 70% 60% at 50% 45%, #000 30%, transparent 78%);
          z-index: -2;
        }

        .bg-glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(650px 420px at 50% -10%, rgba(88, 166, 255, 0.20), transparent 70%),
            radial-gradient(520px 520px at 82% 92%, rgba(167, 139, 250, 0.16), transparent 72%),
            radial-gradient(420px 420px at 12% 88%, rgba(126, 231, 135, 0.08), transparent 70%);
          z-index: -2;
        }

        .floaters {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: -1;
        }

        .floater {
          position: absolute;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
          color: #7ee787;
          white-space: nowrap;
          letter-spacing: 0.04em;
          animation-name: drift;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
          will-change: transform, opacity;
        }

        .floater:nth-child(3n) { color: #a78bfa; }
        .floater:nth-child(3n + 1) { color: #58a6ff; }
        .floater:nth-child(5n) { color: #22d3ee; }

        @keyframes drift {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
            opacity: var(--o, 0.1);
          }
          50% {
            transform: translate3d(26px, -46px, 0) rotate(2deg);
          }
          100% {
            transform: translate3d(-22px, -18px, 0) rotate(-1.5deg);
          }
        }

        /* ---------- 主内容 ---------- */

        .container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 680px;
          text-align: center;
        }

        .eyebrow {
          margin: 0 0 20px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 12px;
          letter-spacing: 0.32em;
          color: #7d8b9e;
          text-transform: uppercase;
        }

        .title {
          margin: 0 0 16px;
          font-size: clamp(44px, 10vw, 84px);
          line-height: 1;
          letter-spacing: -0.05em;
          font-weight: 800;
          background: linear-gradient(120deg, #ffffff 0%, #7dd3fc 32%, #a78bfa 66%, #7ee787 100%);
          background-size: 220% 220%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 0 28px rgba(88, 166, 255, 0.35));
          animation: shimmer 9s ease-in-out infinite;
        }

        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .tagline {
          margin: 0;
          font-size: clamp(15px, 2.4vw, 19px);
          letter-spacing: 0.28em;
          color: #9ecbff;
          text-shadow: 0 0 18px rgba(88, 166, 255, 0.35);
        }

        .divider {
          height: 1px;
          margin: 36px auto;
          max-width: 420px;
          background: linear-gradient(90deg, transparent, rgba(88, 166, 255, 0.65), rgba(167, 139, 250, 0.65), transparent);
          box-shadow: 0 0 18px rgba(88, 166, 255, 0.45);
        }

        /* ---------- 数据卡片 ---------- */

        .list {
          list-style: none;
          padding: 0;
          margin: 0 0 36px;
          text-align: left;
        }

        .list li {
          display: flex;
          align-items: baseline;
          gap: 16px;
          padding: 16px 20px;
          margin-bottom: 12px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          transition: border-color 0.25s ease, background 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
        }

        .list li::before {
          content: '>';
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-weight: 700;
          color: #7ee787;
          opacity: 0.85;
        }

        .list li:hover {
          border-color: rgba(88, 166, 255, 0.42);
          background: rgba(88, 166, 255, 0.06);
          transform: translateY(-2px);
          box-shadow: 0 10px 34px rgba(88, 166, 255, 0.14);
        }

        .key {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-weight: 700;
          color: #58a6ff;
          text-shadow: 0 0 14px rgba(88, 166, 255, 0.5);
          min-width: 56px;
          flex-shrink: 0;
        }

        .text {
          color: #c7d2e0;
          line-height: 1.7;
        }

        /* ---------- 链接按钮 ---------- */

        .links {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 22px;
          border-radius: 999px;
          border: 1px solid rgba(88, 166, 255, 0.35);
          background: rgba(88, 166, 255, 0.07);
          color: #9ecbff;
          text-decoration: none;
          font-size: 14px;
          letter-spacing: 0.04em;
          margin-bottom: 36px;
          transition: border-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }

        .links:hover {
          border-color: rgba(88, 166, 255, 0.75);
          color: #e6f2ff;
          transform: translateY(-2px);
          box-shadow: 0 0 26px rgba(88, 166, 255, 0.4);
        }

        .links svg {
          transition: transform 0.2s ease;
        }

        .links:hover svg {
          transform: translateX(3px);
        }

        /* ---------- 页脚 ---------- */

        .footer {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #6e7681;
          font-size: 12px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          letter-spacing: 0.12em;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #7ee787;
          box-shadow: 0 0 10px rgba(126, 231, 135, 0.9);
          animation: pulse 2.4s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.8); }
        }

        /* ---------- 无障碍 / 降级 ---------- */

        @media (prefers-reduced-motion: reduce) {
          .floater,
          .title,
          .status-dot {
            animation: none !important;
          }
          .list li,
          .links {
            transition: none !important;
          }
        }
      `}</style>
        </div>
    );
};

export default AboutApp;