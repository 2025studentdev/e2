interface Props {
    hp: number;
    knowledge: number;
    current: number;
    total: number;
    time: string;
}

export default function StatusPanel({ hp, knowledge, current, total, time }: Props) {
    const hpPct = Math.min(Math.max(hp / 120, 0), 1) * 100;
    const knPct = Math.min(Math.max(knowledge / 120, 0), 1) * 100;

    return (
        <section className="nd-status">
            <div className="nd-status__row">
                <span className="nd-status__time">{time}</span>
                <span className="nd-status__progress">
          第 {current} / {total} 件事
        </span>
            </div>

            <div className="nd-meter">
                <div className="nd-meter__label">
                    <span>血量</span>
                    <span className="nd-meter__value">{hp}</span>
                </div>
                <div className="nd-meter__track">
                    <div
                        className="nd-meter__fill nd-meter__fill--hp"
                        style={{ width: `${hpPct}%` }}
                    />
                </div>
            </div>

            <div className="nd-meter">
                <div className="nd-meter__label">
                    <span>知识点</span>
                    <span className="nd-meter__value">{knowledge}</span>
                </div>
                <div className="nd-meter__track">
                    <div
                        className="nd-meter__fill nd-meter__fill--kn"
                        style={{ width: `${knPct}%` }}
                    />
                </div>
            </div>
        </section>
    );
}