// /src/components/index-react/DynamicSchedule.tsx
import React, { useState, useEffect } from 'react';
import { classConfig } from './classconfig';

const DAY_KEYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DISPLAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

type DayInfo = {
    dayKey: string;
    displayName: string;
    isWeekend: boolean;
};

function getDayInfo(date: Date): DayInfo {
    const day = date.getDay();
    return {
        dayKey: DAY_KEYS[day],
        displayName: DISPLAY_NAMES[day],
        isWeekend: day === 0 || day === 6,
    };
}

function Period({ label, subjects }: { label: string; subjects: string[] }) {
    return (
        <div className="grid grid-cols-[2.75rem_1fr] items-start gap-x-3">
            <div className="pt-[7px] text-[10px] font-medium tracking-[0.25em] text-[#1A1A1A]/40">
                {label}
            </div>
            <div className="flex flex-wrap gap-1.5">
                {subjects.map((subject, idx) => (
                    <span
                        key={idx}
                        className="rounded-lg bg-[#1A1A1A]/[0.06] px-2.5 py-[7px] text-[13px] font-light leading-none tracking-wide text-[#1A1A1A]/90"
                    >
                        {subject}
                    </span>
                ))}
            </div>
        </div>
    );
}

function Today({ dayInfo }: { dayInfo: DayInfo }) {
    const schedule = !dayInfo.isWeekend ? classConfig[dayInfo.dayKey] : null;
    const morning = schedule?.Morning ?? [];
    const afternoon = schedule?.Afternoon ?? [];
    const hasCourse = morning.length > 0 || afternoon.length > 0;

    return (
        <div className="px-6 pt-6 pb-6">
            <div className="mb-5 flex items-baseline gap-3">
                <h2 className="text-[26px] font-light leading-none tracking-tight text-[#1A1A1A]">
                    星期{dayInfo.displayName}
                </h2>
                <span className="text-[10px] font-medium tracking-[0.3em] text-[#1A1A1A]/40">
                    今日
                </span>
            </div>

            {dayInfo.isWeekend ? (
                <p className="text-[13px] font-light tracking-[0.15em] text-[#1A1A1A]/55">今日休息</p>
            ) : hasCourse ? (
                <div className="space-y-4">
                    {morning.length > 0 && <Period label="上午" subjects={morning} />}
                    {afternoon.length > 0 && <Period label="下午" subjects={afternoon} />}
                </div>
            ) : (
                <p className="text-[13px] font-light tracking-[0.15em] text-[#1A1A1A]/55">暂无课程</p>
            )}
        </div>
    );
}

function Tomorrow({ dayInfo }: { dayInfo: DayInfo }) {
    const schedule = !dayInfo.isWeekend ? classConfig[dayInfo.dayKey] : null;
    const all = [...(schedule?.Morning ?? []), ...(schedule?.Afternoon ?? [])];

    const summary = dayInfo.isWeekend ? '放假' : all.length > 0 ? all.join(' · ') : '暂无课程';

    return (
        <div className="border-t border-[#1A1A1A]/8 bg-[#1A1A1A]/[0.025] px-6 py-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="shrink-0 text-[10px] font-medium tracking-[0.3em] text-[#1A1A1A]/40">明日</span>
                <span className="shrink-0 text-[12px] font-light tracking-[0.08em] text-[#1A1A1A]/55">星期{dayInfo.displayName}</span>
                <span className="text-[12px] font-light leading-relaxed tracking-wide text-[#1A1A1A]/55">{summary}</span>
            </div>
        </div>
    );
}

export default function DynamicSchedule() {
    const [today, setToday] = useState<DayInfo | null>(null);
    const [tomorrow, setTomorrow] = useState<DayInfo | null>(null);

    useEffect(() => {
        const now = new Date();
        const tmr = new Date(now);
        tmr.setDate(now.getDate() + 1);
        setToday(getDayInfo(now));
        setTomorrow(getDayInfo(tmr));
    }, []);

    if (!today || !tomorrow) {
        return (
            <div className="w-full max-w-md mx-auto px-6 py-6 rounded-[18px] border border-[#1A1A1A]/10 bg-white/70 text-[13px] font-light tracking-[0.2em] text-[#1A1A1A]/55 shadow-[0_8px_32px_-12px_rgba(26,26,26,0.2)]">
                加载中
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto rounded-[18px] border border-[#1A1A1A]/10 bg-white/70 shadow-[0_8px_32px_-12px_rgba(26,26,26,0.2)] overflow-hidden">
            <Today dayInfo={today} />
            <Tomorrow dayInfo={tomorrow} />
        </div>
    );
}