export type Letter = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

export interface Question {
    text: string;
    options: { label: string; value: Letter }[];
}

export const QUESTIONS: Question[] = [
    // E / I
    { text: '在一场聚会上，你更可能：', options: [
            { label: '主动和不同的人聊天，乐在其中', value: 'E' },
            { label: '只和一两个熟人安静地深聊', value: 'I' },
        ]},
    { text: '忙碌一周之后，恢复精力的方式是：', options: [
            { label: '出门和朋友聚会热闹一下', value: 'E' },
            { label: '一个人安静地独处一会儿', value: 'I' },
        ]},
    { text: '遇到难题时，你习惯：', options: [
            { label: '边说边想，在讨论中理清思路', value: 'E' },
            { label: '先独自想明白，再说出来', value: 'I' },
        ]},
    { text: '在小组讨论中，你通常是：', options: [
            { label: '积极发言、带动气氛的那一个', value: 'E' },
            { label: '安静倾听，被点到才发言', value: 'I' },
        ]},
    { text: '到了一个全新的环境，你会：', options: [
            { label: '很快和周围的人熟络起来', value: 'E' },
            { label: '先保持观察，慢慢熟悉', value: 'I' },
        ]},
    { text: '你的能量更多来自：', options: [
            { label: '与人的互动和交流', value: 'E' },
            { label: '独处时的思考与沉淀', value: 'I' },
        ]},
    { text: '理想的周末更接近：', options: [
            { label: '行程安排得满满当当才不虚度', value: 'E' },
            { label: '多留些空白给自己，安静度过', value: 'I' },
        ]},
    // S / N
    { text: '你更关注：', options: [
            { label: '眼前具体的事实和细节', value: 'S' },
            { label: '事物背后的可能性和趋势', value: 'N' },
        ]},
    { text: '学习新知识时，你更喜欢：', options: [
            { label: '从实际案例和操作入手', value: 'S' },
            { label: '从理论框架和概念入手', value: 'N' },
        ]},
    { text: '描述同一件事时，你会：', options: [
            { label: '如实讲述发生的经过', value: 'S' },
            { label: '加入想象、比喻和联想', value: 'N' },
        ]},
    { text: '做判断时，你更信任：', options: [
            { label: '亲身验证过的经验', value: 'S' },
            { label: '直觉和突然出现的灵感', value: 'N' },
        ]},
    { text: '规划一个项目时，你先看：', options: [
            { label: '具体步骤和可执行细节', value: 'S' },
            { label: '整体愿景和大方向', value: 'N' },
        ]},
    { text: '什么更容易吸引你：', options: [
            { label: '实用的新工具、新方法', value: 'S' },
            { label: '新奇的观点和大开的脑洞', value: 'N' },
        ]},
    { text: '解决问题时，你倾向于：', options: [
            { label: '借鉴过去行之有效的做法', value: 'S' },
            { label: '尝试从未有人走过的路径', value: 'N' },
        ]},
    // T / F
    { text: '做重要决定时，你更看重：', options: [
            { label: '逻辑是否成立、是否合理', value: 'T' },
            { label: '相关人的感受和价值观', value: 'F' },
        ]},
    { text: '朋友向你倾诉烦恼，你会先：', options: [
            { label: '帮他分析问题出在哪里', value: 'T' },
            { label: '先接住他的情绪，给他安慰', value: 'F' },
        ]},
    { text: '面对分歧，你倾向于：', options: [
            { label: '就事论事，对事不对人', value: 'T' },
            { label: '因人而异，顾及每个人的立场', value: 'F' },
        ]},
    { text: '评价一个方案，你首先看：', options: [
            { label: '是否高效、合理', value: 'T' },
            { label: '是否被大家接受和喜欢', value: 'F' },
        ]},
    { text: '你更愿意别人评价你：', options: [
            { label: '头脑清醒、客观公正', value: 'T' },
            { label: '善解人意、温暖可靠', value: 'F' },
        ]},
    { text: '给别人提意见时，你通常：', options: [
            { label: '直截了当指出问题', value: 'T' },
            { label: '委婉表达，照顾对方的感受', value: 'F' },
        ]},
    { text: '你自认为：', options: [
            { label: '比较理性，情绪不太影响判断', value: 'T' },
            { label: '比较感性，很容易被触动', value: 'F' },
        ]},
    // J / P
    { text: '面对日程安排，你喜欢：', options: [
            { label: '提前规划好，按计划推进', value: 'J' },
            { label: '保持弹性，随机应变', value: 'P' },
        ]},
    { text: '面对截止日期，你通常：', options: [
            { label: '提前完成，心里才踏实', value: 'J' },
            { label: '临近截止时效率最高', value: 'P' },
        ]},
    { text: '你的书桌或桌面一般是：', options: [
            { label: '井井有条，东西各归其位', value: 'J' },
            { label: '看似凌乱，但我心中有数', value: 'P' },
        ]},
    { text: '出门旅行时，你偏好：', options: [
            { label: '攻略详细，行程明确', value: 'J' },
            { label: '随走随停，随遇而安', value: 'P' },
        ]},
    { text: '面临选择时，你更希望：', options: [
            { label: '尽快确定下来', value: 'J' },
            { label: '多保留一些可能性', value: 'P' },
        ]},
    { text: '你更难忍受的是：', options: [
            { label: '计划被打乱带来的不确定', value: 'J' },
            { label: '被条条框框束缚的感觉', value: 'P' },
        ]},
    { text: '对于规则，你的看法是：', options: [
            { label: '规则带来秩序和效率', value: 'J' },
            { label: '规则应当灵活变通', value: 'P' },
        ]},
];

export interface TypeInfo {
    name: string;
    alias: string;
    summary: string;
    traits: string[];
}

export const TYPES: Record<string, TypeInfo> = {
    INTJ: { name: '建筑师', alias: 'The Architect', summary: '冷静独立的战略思考者，擅长用长远眼光搭建体系。你对能力要求高，喜欢用逻辑拆解世界，一旦认定目标就会安静而坚定地推进。', traits: ['独立自主', '战略眼光', '理性冷静', '追求卓越'] },
    INTP: { name: '逻辑学家', alias: 'The Logician', summary: '对知识和逻辑充满好奇的思想者，享受探索概念与原理本身。你思维开放，喜欢追问“为什么”，常常能提出与众不同的解法。', traits: ['逻辑严密', '好奇求知', '思维开放', '创新独到'] },
    ENTJ: { name: '指挥官', alias: 'The Commander', summary: '天生的组织者和决策者，擅长洞察全局并高效调动资源。你目标感强、行动力十足，在压力之下反而更加果断。', traits: ['果断坚决', '领导力强', '目标导向', '坦率直接'] },
    ENTP: { name: '辩论家', alias: 'The Debater', summary: '机敏善辩的思维挑战者，热爱智力上的交锋与新可能。你点子不断，享受打破常规，擅长在辩论中打磨出更好的方案。', traits: ['机智敏捷', '敢于质疑', '创意丰富', '适应力强'] },
    INFJ: { name: '提倡者', alias: 'The Advocate', summary: '安静而坚定的理想主义者，对他人有着深刻的洞察力。你内心有强烈的信念，愿意为在意的人和事长期付出。', traits: ['洞察力深', '理想主义', '温和坚定', '富有同理心'] },
    INFP: { name: '调停者', alias: 'The Mediator', summary: '温柔而内心坚定的价值守护者，凡事以“是否真诚”为准绳。你想象力丰富，表面随和，内心却有着不可退让的底线。', traits: ['真诚善良', '想象丰富', '重视内心', '灵活包容'] },
    ENFJ: { name: '主人公', alias: 'The Protagonist', summary: '富有感召力的引路人，天然地关注他人的成长。你善于鼓舞团队，能把愿景讲得让人愿意跟随，并真的帮到身边的人。', traits: ['善于鼓舞', '责任心强', '洞察他人', '乐于成就他人'] },
    ENFP: { name: '竞选者', alias: 'The Campaigner', summary: '热情洋溢的灵感火花，对人和可能性都充满兴趣。你感染力十足，讨厌僵化流程，总能给周围带来新鲜的能量。', traits: ['热情感染', '创意无限', '自由随性', '善解人意'] },
    ISTJ: { name: '物流师', alias: 'The Logistician', summary: '可靠务实的执行者，言出必行、注重事实与秩序。你不擅花言巧语，但交给你的事情总能被稳妥地落实。', traits: ['踏实可靠', '注重细节', '严谨守序', '责任心强'] },
    ISFJ: { name: '守卫者', alias: 'The Defender', summary: '温暖尽责的守护者，默默把身边的人照顾得妥妥帖帖。你记忆力出色、观察细致，用行动而非言语表达在意。', traits: ['体贴周到', '尽职尽责', '观察细致', '坚韧可靠'] },
    ESTJ: { name: '总经理', alias: 'The Executive', summary: '雷厉风行的组织者，擅长建立秩序并推动事情落地。你直率务实，重视规则与效率，是团队里最值得信赖的顶梁柱。', traits: ['务实高效', '组织力强', '坦率直言', '信守承诺'] },
    ESFJ: { name: '执政官', alias: 'The Consul', summary: '热心体贴的协调者，总能敏锐察觉群体的需要。你重视和谐与责任，乐于组织与照料，让身边的人都感到被照顾。', traits: ['热心助人', '重视和谐', '细致周到', '忠诚尽责'] },
    ISTP: { name: '鉴赏家', alias: 'The Virtuoso', summary: '冷静灵巧的实干者，喜欢亲手拆解和摆弄事物。你观察敏锐、临危不乱，擅长用最直接的方式解决眼前的问题。', traits: ['动手力强', '冷静沉着', '观察敏锐', '独立务实'] },
    ISFP: { name: '探险家', alias: 'The Adventurer', summary: '敏感自由的艺术家，用审美和行动感受世界。你温和谦逊、不喜张扬，却对生活有着自己独特的品味和坚持。', traits: ['审美独到', '温和谦逊', '活在当下', '忠于自我'] },
    ESTP: { name: '企业家', alias: 'The Entrepreneur', summary: '行动力十足的冒险家，享受当下的挑战与刺激。你反应快、胆子大，擅长在瞬息万变中抓住机会、当场解决。', traits: ['行动力强', '果敢决断', '随机应变', '精力充沛'] },
    ESFP: { name: '表演者', alias: 'The Entertainer', summary: '点亮气氛的快乐源泉，走到哪都把欢笑带到哪。你热爱生活、感知敏锐，善于用热情让每个人都放松下来。', traits: ['活力四射', '幽默热情', '感知敏锐', '慷慨大方'] },
};

export const DIMENSIONS: { left: Letter; right: Letter; leftLabel: string; rightLabel: string }[] = [
    { left: 'E', right: 'I', leftLabel: '外向 E', rightLabel: '内向 I' },
    { left: 'S', right: 'N', leftLabel: '实感 S', rightLabel: '直觉 N' },
    { left: 'T', right: 'F', leftLabel: '思考 T', rightLabel: '情感 F' },
    { left: 'J', right: 'P', leftLabel: '判断 J', rightLabel: '感知 P' },
];

/** 固定种子的洗牌，保证每次加载题目顺序一致且四维度均匀穿插 */
export function shuffledQuestions(): Question[] {
    const arr = QUESTIONS.map((q, i) => ({ q, i }));
    let seed = 2147483647;
    const rand = () => {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return seed / 2147483648;
    };
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.map((x) => x.q);
}