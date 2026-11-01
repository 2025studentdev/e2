import type { HistoryEntry } from './_gameTypes';

interface Props {
    history: HistoryEntry[];
}

export default function HistoryStrip({ history }: Props) {
    if (history.length === 0) {
        return (
            <section className="nd-history">
                <span className="nd-history__label">轨迹</span>
                <span className="nd-history__placeholder">还没有做出选择</span>
            </section>
        );
    }

    return (
        <section className="nd-history">
            <span className="nd-history__label">轨迹</span>
            <div className="nd-history__list">
                {history.map((entry, index) => (
                    <span
                        key={`${entry.eventId}-${index}`}
                        className={`nd-history__item ${
                            entry.tendency === 'invest' ? 'is-invest' : 'is-recover'
                        }`}
                        title={`${entry.time} ${entry.eventTitle}：${entry.optionLabel}`}
                    >
            <span className="nd-history__dot" />
                        {entry.eventTitle}
          </span>
                ))}
            </div>
        </section>
    );
}