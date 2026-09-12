//This is /src/components/index-react/classconfig.ts

export interface DaySchedule {
    Morning: string[];
    Afternoon: string[];
}

export const classConfig: Record<string, DaySchedule> = {
    // 星期一：上午（数 物 英 英），下午（历 语 政 班）
    Monday: {
        Morning: ['数', '物', '英', '英'],
        Afternoon: ['历', '语', '政', '班'],
    },
    // 星期二：上午（语 语 数 英），下午（物 历 生 社）
    Tuesday: {
        Morning: ['语', '语', '数', '英'],
        Afternoon: ['物', '历', '生', '社'],
    },
    // 星期三：上午（化 语 地 英），下午（生 体 物 数）
    Wednesday: {
        Morning: ['化', '语', '地', '英'],
        Afternoon: ['生', '体', '物', '数'],
    },
    // 星期四：上午（化 语 音 体），下午（数 数 英 信）
    Thursday: {
        Morning: ['化', '语', '音', '体'],
        Afternoon: ['数', '数', '英', '信'],
    },
    // 星期五：上午（数 语 英 化），下午（地 生 政 物）
    Friday: {
        Morning: ['数', '语', '英', '化'],
        Afternoon: ['地', '生', '政', '物'],
    },
};