import { useCallback, useEffect, useRef, useState } from 'react';
import { events } from './_gameData';
import { computeResult } from './_scoring';
import type {
    HistoryEntry,
    Option,
    Phase,
    ScoreResult,
} from './_gameTypes';
import StatusPanel from './_StatusPanel';
import EventCard from './_EventCard';
import FeedbackCard from './_FeedbackCard';
import HistoryStrip from './_HistoryStrip';
import ResultPanel from './_ResultPanel';
import './_game.css';

interface LastChoice {
    option: Option;
    hpDelta: number;
    knDelta: number;
}

export default function Game() {
    const [hp, setHp] = useState(100);
    const [knowledge, setKnowledge] = useState(100);
    const [eventIndex, setEventIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>('playing');
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [lastChoice, setLastChoice] = useState<LastChoice | null>(null);
    const [result, setResult] = useState<ScoreResult | null>(null);

    const chosenRef = useRef(false);
    const currentEvent = events[eventIndex];

    const choose = useCallback(
        (option: Option) => {
            if (chosenRef.current || phase !== 'playing') return;
            chosenRef.current = true;

            const hpDelta = option.hp;
            const knDelta = option.knowledge;

            setHp((prev) => prev + hpDelta);
            setKnowledge((prev) => prev + knDelta);
            setHistory((prev) => [
                ...prev,
                {
                    eventId: currentEvent.id,
                    eventTitle: currentEvent.title,
                    time: currentEvent.time,
                    optionLabel: option.label,
                    hp: hpDelta,
                    knowledge: knDelta,
                    tendency: option.tendency,
                },
            ]);
            setLastChoice({ option, hpDelta, knDelta });
            setPhase('feedback');
        },
        [phase, currentEvent]
    );

    const next = useCallback(() => {
        if (phase !== 'feedback') return;

        const nextIndex = eventIndex + 1;
        if (nextIndex >= events.length) {
            setResult(computeResult(hp, knowledge, history));
            setPhase('result');
        } else {
            setEventIndex(nextIndex);
            setLastChoice(null);
            setPhase('playing');
            chosenRef.current = false;
        }
    }, [phase, eventIndex, hp, knowledge, history]);

    const restart = useCallback(() => {
        setHp(100);
        setKnowledge(100);
        setEventIndex(0);
        setPhase('playing');
        setHistory([]);
        setLastChoice(null);
        setResult(null);
        chosenRef.current = false;
    }, []);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (phase === 'playing') {
                if (event.key === '1') choose(currentEvent.options[0]);
                else if (event.key === '2') choose(currentEvent.options[1]);
            } else if (phase === 'feedback') {
                if (event.key === 'Enter') next();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [phase, choose, next, currentEvent]);

    return (
        <div className="nd-shell">
            <header className="nd-header">
                <h1 className="nd-title">平常的一天</h1>
                <p className="nd-subtitle">在学习和休息之间，找到自己的节奏</p>
            </header>

            {phase !== 'result' && (
                <StatusPanel
                    hp={hp}
                    knowledge={knowledge}
                    current={eventIndex + 1}
                    total={events.length}
                    time={currentEvent.time}
                />
            )}

            {phase === 'playing' && (
                <EventCard
                    key={currentEvent.id}
                    event={currentEvent}
                    onChoose={choose}
                />
            )}

            {phase === 'feedback' && lastChoice && (
                <FeedbackCard
                    key={`feedback-${currentEvent.id}`}
                    event={currentEvent}
                    option={lastChoice.option}
                    hpDelta={lastChoice.hpDelta}
                    knDelta={lastChoice.knDelta}
                    onContinue={next}
                />
            )}

            {phase === 'result' && result && (
                <ResultPanel result={result} history={history} onRestart={restart} />
            )}

            {phase !== 'result' && <HistoryStrip history={history} />}
        </div>
    );
}