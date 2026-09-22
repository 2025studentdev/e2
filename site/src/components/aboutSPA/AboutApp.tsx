import * as React from 'react';

const AboutApp: React.FC = () => {
    return (
        <div className="about-app">
            <main className="container">
                <h1 className="title">E2147dev</h1>
                <p className="subtitle">一个 ID 背后的含义</p>

                <div className="formula">
                    <span className="dim">2</span>
                    <sup>31</sup>
                    <span className="dim"> − 1 = </span>
                    <span className="highlight">2,147,483,647</span>
                </div>

                <ul className="list">
                    <li>
                        <span className="key">E</span>
                        <span className="text">Electronic — 电子，计算机与数字世界。</span>
                    </li>
                    <li>
                        <span className="key">2147</span>
                        <span className="text">
              2³¹ − 1，32 位有符号整数最大值 <code>INT_MAX</code>。
            </span>
                    </li>
                    <li>
                        <span className="key">dev</span>
                        <span className="text">Developer — 开发者，用代码构建东西的人。</span>
                    </li>
                </ul>

                <p className="note">
                    三部分拼在一起，就是这个名字：电子世界的开发者，站在整数的边界上。
                </p>

                <a className="links" href="../links">
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
                    <span>© {new Date().getFullYear()} E2147dev</span>
                </footer>
            </main>

            <style>{`
        .about-app {
          min-height: 100vh;
          background: #0a0c10;
          color: #e8eef7;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
        }

        .container {
          width: 100%;
          max-width: 640px;
          text-align: center;
        }

        .title {
          font-size: clamp(40px, 9vw, 72px);
          line-height: 1;
          margin: 0 0 12px;
          letter-spacing: -0.05em;
          background: linear-gradient(135deg, #ffffff 0%, #7ee787 45%, #58a6ff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .subtitle {
          color: #8b949e;
          font-size: 16px;
          margin: 0 0 40px;
        }

        .formula {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: clamp(20px, 4vw, 32px);
          letter-spacing: -0.03em;
          margin-bottom: 40px;
        }

        .formula sup {
          font-size: 0.55em;
          color: #7ee787;
        }

        .dim {
          color: #8b949e;
        }

        .highlight {
          color: #7ee787;
          text-shadow: 0 0 24px rgba(126, 231, 135, 0.3);
        }

        .list {
          list-style: none;
          padding: 0;
          margin: 0 0 40px;
          text-align: left;
        }

        .list li {
          display: flex;
          align-items: baseline;
          gap: 16px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .list li:first-child {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .key {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-weight: 700;
          color: #58a6ff;
          min-width: 56px;
          flex-shrink: 0;
        }

        .text {
          color: #c9d1d9;
          line-height: 1.7;
        }

        .text code {
          color: #7ee787;
          background: rgba(126, 231, 135, 0.1);
          padding: 1px 6px;
          border-radius: 5px;
          font-size: 0.9em;
        }

        .note {
          color: #8b949e;
          line-height: 1.9;
          margin: 0 0 40px;
        }

        .links {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #c9d1d9;
          text-decoration: none;
          font-size: 14px;
          margin-bottom: 40px;
          transition: border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }

        .links:hover {
          border-color: rgba(88, 166, 255, 0.5);
          color: #58a6ff;
          transform: translateY(-1px);
        }

        .links svg {
          transition: transform 0.2s ease;
        }

        .links:hover svg {
          transform: translateX(2px);
        }

        .footer {
          color: #6e7681;
          font-size: 13px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        }

        @media (prefers-color-scheme: light) {
          .about-app {
            background: #f6f8fa;
            color: #1f2328;
          }

          .title {
            background: linear-gradient(135deg, #1f2328 0%, #1a7f37 45%, #0969da 100%);
            -webkit-background-clip: text;
            background-clip: text;
          }

          .subtitle,
          .note,
          .footer {
            color: #57606a;
          }

          .dim {
            color: #57606a;
          }

          .highlight {
            color: #1a7f37;
            text-shadow: none;
          }

          .formula sup {
            color: #1a7f37;
          }

          .list li,
          .list li:first-child {
            border-color: rgba(31, 35, 40, 0.08);
          }

          .key {
            color: #0969da;
          }

          .text {
            color: #24292f;
          }

          .text code {
            color: #1a7f37;
            background: rgba(26, 127, 55, 0.1);
          }

          .links {
            border-color: rgba(31, 35, 40, 0.12);
            color: #24292f;
          }

          .links:hover {
            border-color: rgba(9, 105, 218, 0.5);
            color: #0969da;
          }
        }
      `}</style>
        </div>
    );
};

export default AboutApp;