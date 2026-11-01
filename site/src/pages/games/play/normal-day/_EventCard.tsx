import type { GameEvent, Option } from './_gameTypes';

interface Props {
    event: GameEvent;
    onChoose: (option: Option) => void;
}

export default function EventCard({ event, onChoose }: Props) {
    return (
        <section className="nd-event">
            <div className="nd-event__meta">
                <span className="nd-event__time">{event.time}</span>
                <span className="nd-event__title">{event.title}</span>
            </div>
            <p className="nd-event__scene">{event.scene}</p>

            <div className="nd-options">
                {event.options.map((option, index) => (
                    <button
                        key={option.id}
                        type="button"
                        className="nd-option"
                        onClick={() => onChoose(option)}
                    >
                        <span className="nd-option__index">{index + 1}</span>
                        <span className="nd-option__body">
              <span className="nd-option__label">{option.label}</span>
              <span className="nd-option__detail">{option.detail}</span>
            </span>
                    </button>
                ))}
            </div>

            <p className="nd-hint">按 1 或 2 键快速选择</p>
        </section>
    );
}