import type { GameEvent, Option } from './_gameTypes';

interface Props {
    event: GameEvent;
    option: Option;
    hpDelta: number;
    knDelta: number;
    onContinue: () => void;
}

function formatDelta(value: number) {
    return value > 0 ? `+${value}` : `${value}`;
}

export default function FeedbackCard({
                                         event,
                                         option,
                                         hpDelta,
                                         knDelta,
                                         onContinue,
                                     }: Props) {
    return (
        <section className="nd-feedback">
            <div className="nd-feedback__meta">
                <span className="nd-event__time">{event.time}</span>
                <span className="nd-event__title">{event.title}</span>
            </div>

            <p className="nd-feedback__choice">你选择了：{option.label}</p>
            <p className="nd-feedback__text">{option.feedback}</p>

            <div className="nd-deltas">
        <span className={`nd-delta ${hpDelta < 0 ? 'is-neg' : 'is-pos'}`}>
          血量 {formatDelta(hpDelta)}
        </span>
                <span className={`nd-delta ${knDelta < 0 ? 'is-neg' : 'is-pos'}`}>
          知识点 {formatDelta(knDelta)}
        </span>
            </div>

            <button type="button" className="nd-continue" onClick={onContinue}>
                继续
                <span className="nd-continue__hint">Enter</span>
            </button>
        </section>
    );
}