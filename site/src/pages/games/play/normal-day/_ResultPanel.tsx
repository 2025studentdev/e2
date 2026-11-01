import type { HistoryEntry, ScoreResult } from './_gameTypes';

interface Props {
    result: ScoreResult;
    history: HistoryEntry[];
    onRestart: () => void;
}

export default function ResultPanel({ result, history, onRestart }: Props) {
    return (
        <section className="nd-result">
            <div className="nd-result__head">
                <span className="nd-result__grade">{result.grade}</span>
                <div>
                    <h2 className="nd-result__title">{result.gradeLabel}</h2>
                    <p className="nd-result__summary">{result.summary}</p>
                </div>
            </div>

            <div className="nd-result__score">
                <span className="nd-result__score-num">{result.total}</span>
                <span className="nd-result__score-unit">分</span>
            </div>

            <div className="nd-result__grid">
                <div className="nd-result__cell">
                    <span className="nd-result__cell-label">平衡得分</span>
                    <span className="nd-result__cell-value">
            {Math.round(result.balanceScore)} / 45
          </span>
                </div>
                <div className="nd-result__cell">
                    <span className="nd-result__cell-label">血量状态</span>
                    <span className="nd-result__cell-value">
            {Math.round(result.hpScore)} / 27.5
          </span>
                </div>
                <div className="nd-result__cell">
                    <span className="nd-result__cell-label">知识状态</span>
                    <span className="nd-result__cell-value">
            {Math.round(result.knowledgeScore)} / 27.5
          </span>
                </div>
                <div className="nd-result__cell">
                    <span className="nd-result__cell-label">投入比例</span>
                    <span className="nd-result__cell-value">
            {Math.round(result.investRatio * 100)}%
          </span>
                </div>
            </div>

            {result.penalty && (
                <p className="nd-result__penalty">
                    节奏过于极端，总分被大幅削减。
                </p>
            )}

            <div className="nd-result__history">
                <span className="nd-result__history-label">这一天</span>
                <ul className="nd-result__timeline">
                    {history.map((entry, index) => (
                        <li key={`${entry.eventId}-${index}`} className="nd-result__timeline-item">
                            <span className="nd-result__timeline-time">{entry.time}</span>
                            <span className="nd-result__timeline-title">{entry.eventTitle}</span>
                            <span
                                className={`nd-result__timeline-tag ${
                                    entry.tendency === 'invest' ? 'is-invest' : 'is-recover'
                                }`}
                            >
                {entry.optionLabel}
              </span>
                        </li>
                    ))}
                </ul>
            </div>

            <button type="button" className="nd-restart" onClick={onRestart}>
                再过一天
            </button>
        </section>
    );
}