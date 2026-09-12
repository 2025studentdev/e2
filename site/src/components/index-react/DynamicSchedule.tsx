//This is /src/components/index-react/DynamicSchedule.tsx
import React, { useState, useEffect } from 'react';
import { classConfig } from './classconfig';

export default function DynamicSchedule() {
    const [dayInfo, setDayInfo] = useState<{
        dayKey: string;
        displayName: string;
        isWeekend: boolean;
    } | null>(null);

    useEffect(() => {
        const day = new Date().getDay();
        const dayKeys = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const displayNames = ['日', '一', '二', '三', '四', '五', '六'];
        const dayKey = dayKeys[day];
        const isWeekend = day === 0 || day === 6;
        setDayInfo({ dayKey, displayName: displayNames[day], isWeekend });
    }, []);

    if (!dayInfo) {
        return (
            <div className="w-full max-w-sm mx-auto p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-center text-gray-500 dark:text-slate-400 shadow-xl transition-colors duration-500">
                加载中...
            </div>
        );
    }

    if (dayInfo.isWeekend) {
        return (
            <div className="w-full max-w-sm mx-auto p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-center shadow-xl transition-colors duration-500">
                <h2 className="text-2xl font-bold text-sky-600 dark:text-sky-400 mb-2">放假了</h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm">今天不上课</p>
            </div>
        );
    }

    const schedule = classConfig[dayInfo.dayKey];

    return (
        <div className="w-full max-w-sm mx-auto p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl transition-all hover:shadow-2xl hover:border-gray-300 dark:hover:border-slate-600">
            <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-5 border-b border-gray-200 dark:border-slate-700 pb-3 transition-colors duration-500">
                今天星期{dayInfo.displayName}
            </h2>
            {schedule ? (
                <div className="space-y-5">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-gray-500 dark:text-slate-400 tracking-wider transition-colors duration-500">上午</span>
                        <div className="flex flex-wrap gap-2">
                            {schedule.Morning.map((subject, idx) => (
                                <span key={idx} className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 transition-colors duration-500">
                  {subject}
                </span>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-gray-500 dark:text-slate-400 tracking-wider transition-colors duration-500">下午</span>
                        <div className="flex flex-wrap gap-2">
                            {schedule.Afternoon.map((subject, idx) => (
                                <span key={idx} className="px-3 py-1 text-sm rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 transition-colors duration-500">
                  {subject}
                </span>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-gray-500 dark:text-slate-500 text-sm text-center py-4 transition-colors duration-500">暂无课程安排</div>
            )}
        </div>
    );
}