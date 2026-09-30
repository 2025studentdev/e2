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
        <div className="grid grid-cols-[3.25rem_1fr] items-start gap-x-4">
            <div className="pt-[5px] text-[11px] font-semibold tracking-[0.25em] text-[#EDEAE3]/50">
                {label}
            </div>
            <div className="flex flex-wrap gap-1.5">
                {subjects.map((subject, idx) => (
                    <span
                        key={idx}
                        className="bg-[#EDEAE3]/[0.08] px-3 py-2 text-[16px] font-light leading-none tracking-wide text-[#EDEAE3]"
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
        <div className="px-6 pt-7 pb-7">
            <div className="mb-6 flex items-baseline gap-3">
                <h2 className="text-[36px] font-light leading-none tracking-tight text-[#EDEAE3]">
                    星期{dayInfo.displayName}
                </h2>
                <span className="text-[11px] font-semibold tracking-[0.35em] text-[#EDEAE3]/50">
                    今日
                </span>
            </div>

            {dayInfo.isWeekend ? (
                <p className="text-[16px] font-light tracking-[0.15em] text-[#EDEAE3]/65">今日休息</p>
            ) : hasCourse ? (
                <div className="space-y-4">
                    {morning.length > 0 && <Period label="上午" subjects={morning} />}
                    {afternoon.length > 0 && <Period label="下午" subjects={afternoon} />}
                </div>
            ) : (
                <p className="text-[16px] font-light tracking-[0.15em] text-[#EDEAE3]/65">暂无课程</p>
            )}
        </div>
    );
}

function Tomorrow({ dayInfo }: { dayInfo: DayInfo }) {
    const schedule = !dayInfo.isWeekend ? classConfig[dayInfo.dayKey] : null;
    const all = [...(schedule?.Morning ?? []), ...(schedule?.Afternoon ?? [])];

    const summary = dayInfo.isWeekend ? '放假' : all.length > 0 ? all.join(' · ') : '暂无课程';

    return (
        <div className="border-t-2 border-[#EDEAE3]/30 bg-[#EDEAE3]/[0.04] px-6 py-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                <span className="shrink-0 text-[11px] font-semibold tracking-[0.35em] text-[#EDEAE3]/50">明日</span>
                <span className="shrink-0 text-[15px] font-light tracking-[0.08em] text-[#EDEAE3]/70">星期{dayInfo.displayName}</span>
                <span className="text-[15px] font-light leading-relaxed tracking-wide text-[#EDEAE3]/70">{summary}</span>
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
            <div className="w-full max-w-md mx-auto border-2 border-[#EDEAE3]/30 bg-[#EDEAE3]/[0.03] px-6 py-8 text-[16px] font-light tracking-[0.2em] text-[#EDEAE3]/65">
                加载中
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto border-2 border-[#EDEAE3]/30 bg-[#EDEAE3]/[0.03] overflow-hidden">
            <Today dayInfo={today} />
            <Tomorrow dayInfo={tomorrow} />
        </div>
    );
}