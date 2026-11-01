export type Tendency = 'invest' | 'recover';

export interface Option {
    id: string;
    label: string;
    detail: string;
    hp: number;
    knowledge: number;
    tendency: Tendency;
    feedback: string;
}

export interface GameEvent {
    id: string;
    time: string;
    title: string;
    scene: string;
    options: [Option, Option];
}

export interface HistoryEntry {
    eventId: string;
    eventTitle: string;
    time: string;
    optionLabel: string;
    hp: number;
    knowledge: number;
    tendency: Tendency;
}

export type Phase = 'playing' | 'feedback' | 'result';

export interface ScoreResult {
    total: number;
    grade: string;
    gradeLabel: string;
    investRatio: number;
    hpScore: number;
    knowledgeScore: number;
    balanceScore: number;
    penalty: boolean;
    summary: string;
}