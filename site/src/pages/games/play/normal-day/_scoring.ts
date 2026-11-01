import type { HistoryEntry, ScoreResult } from './_gameTypes';

export function computeResult(
    hp: number,
    knowledge: number,
    history: HistoryEntry[]
): ScoreResult {
    const total = history.length;
    const investCount = history.filter((h) => h.tendency === 'invest').length;
    const investRatio = total === 0 ? 0 : investCount / total;

    const distance = Math.abs(investRatio - 0.5);
    const balanceScore =
        distance <= 0.1 ? 45 : 45 * Math.max(0, 1 - (distance - 0.1) / 0.4);

    const hpScore = 27.5 * Math.min(Math.max(hp / 120, 0), 1);
    const knowledgeScore = 27.5 * Math.min(Math.max(knowledge / 120, 0), 1);

    let totalScore = balanceScore + hpScore + knowledgeScore;
    let penalty = false;

    if (investRatio >= 0.9 || investRatio <= 0.1) {
        totalScore *= 0.7;
        penalty = true;
    }
    if (hp < 30 || knowledge < 30) {
        totalScore *= 0.7;
        penalty = true;
    }

    const rounded = Math.round(totalScore);

    let grade = 'D';
    let gradeLabel = '失衡的一天';
    if (rounded >= 88) {
        grade = 'S';
        gradeLabel = '从容的一天';
    } else if (rounded >= 72) {
        grade = 'A';
        gradeLabel = '踏实的一天';
    } else if (rounded >= 56) {
        grade = 'B';
        gradeLabel = '尚可的一天';
    } else if (rounded >= 40) {
        grade = 'C';
        gradeLabel = '偏科的一天';
    }

    return {
        total: rounded,
        grade,
        gradeLabel,
        investRatio,
        hpScore,
        knowledgeScore,
        balanceScore,
        penalty,
        summary: buildSummary(investRatio, hp, knowledge, rounded),
    };
}

function buildSummary(
    ratio: number,
    hp: number,
    knowledge: number,
    total: number
): string {
    if (total >= 88) return '学习和休息都照顾到了，这一天过得很稳。';
    if (ratio >= 0.9) return '你几乎把所有时间都压在书本上，身体开始抗议。';
    if (ratio <= 0.1) return '你几乎放空了一整天，知识点悄悄溜走了。';
    if (hp < 40) return '你撑到了最后，但身体已经透支，需要好好休息。';
    if (knowledge < 40) return '你休息得不错，但今天学到的东西实在有限。';
    if (ratio > 0.7) return '你偏向投入，收获不少，但别忘了给身体留点余地。';
    if (ratio < 0.3) return '你偏向放松，状态不错，但学习节奏有些松散。';
    if (total >= 72) return '节奏大体均衡，是个不错的一天。';
    return '这一天过得有些摇摆，试着在学习和休息之间找到更稳的节奏。';
}