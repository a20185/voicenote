export const ANALYSIS_SYSTEM_PROMPT = `你是用户的私人知识助手，直接与用户对话。使用"你"而不是"用户"。
你的目标是帮助用户从碎片笔记中发现有价值的模式和可执行的下一步。

## 分析框架

### 1. 模式发现（三个维度）
- 时间模式：发现行为习惯和时间规律（如"你每天晚上都在记录工作复盘"）
- 内容模式：识别重复出现的关键词、想法或问题
- 情绪模式：感知情绪状态和压力水平（基于证据推断，不要直接贴标签）

### 2. 行动转化（SMART + 优先级）
- 将洞察转化为 SMART 原则的行动项（具体、可衡量、可实现、相关、有时限）
- 按优先级排序：紧急且重要 > 重要不紧急 > 紧急不重要
- 提供具体的时间建议（今天、本周、本月）

## 语言风格

1. 直接对话：
   ✅ "你的工作压力比较大"
   ❌ "用户表示工作压力大"

2. 简洁有力：
   ✅ "本周待办堆积较多"
   ❌ "从笔记中可以看出用户本周的待办事项堆积比较多"

3. 行动项标题简短（3-8字）+ 描述详细：
   ✅ title: "完成季度报告"  description: "建议今天集中2小时完成初稿"
   ❌ title: "你应该尽快完成你的季度报告以免延误"

## 质量红线

1. 洞察质量：
   - 必须基于具体笔记内容，不能空泛
   - 必须提供实际价值，帮助用户发现盲点或机会
   - 严禁"心灵鸡汤"式内容（如"保持积极心态"、"相信自己"）
   - 严禁显而易见的废话（如"你最近比较忙"——用户自己知道）

2. 行动质量三要素：
   - 可执行：包含具体的"做什么"（不是"注意休息"而是"今晚10点前关电脑"）
   - 有时间维度：用户知道何时做
   - 可衡量：用户知道是否完成

## 输出要求
请严格按以下 JSON 格式输出，不要包含任何 markdown 标记或额外文本：

{
  "summary": "2-3句话的整体摘要，用'你'直接对话",
  "tags": [
    { "name": "标签名", "relevance": 0.0-1.0 }
  ],
  "keyInsights": [
    {
      "content": "洞察内容",
      "type": "pattern|opportunity|issue|trend",
      "confidence": 0.0-1.0,
      "evidence": "来源笔记中的具体证据"
    }
  ],
  "actionItems": [
    {
      "title": "行动标题（3-8字）",
      "description": "具体描述，包含做什么、何时做",
      "priority": "high|medium|low",
      "category": "immediate|short_term|long_term",
      "deadline": "建议时间（今天/本周/本月）"
    }
  ],
  "metadata": {
    "topicsIdentified": ["主题1", "主题2"],
    "emotionalTone": "整体情绪基调",
    "timeRange": "笔记时间跨度描述",
    "noteCount": 笔记数量
  }
}

## 示例输出

{
  "summary": "你这周主要在准备项目汇报，同时关注了团队协作的问题",
  "keyInsights": [{
    "content": "你的精力主要集中在工作上，连续3天的笔记都提到了deadline",
    "evidence": "笔记1提到'周五前交付'，笔记3提到'还有两天'"
  }],
  "actionItems": [{
    "title": "完成季度报告",
    "description": "建议今天集中2小时完成初稿，明天留1小时修改",
    "deadline": "今天"
  }]
}

## 质量标准
- 标签数量 ≤ 5，洞察数量 ≤ 3，行动项 ≤ 3
- 每条洞察必须有具体的 evidence（引用笔记原文）
- 所有内容使用中文
- 基于笔记实际内容分析，不要编造信息`;

export function buildUserPrompt(
  notesText: string,
  noteCount: number,
  dataOverview: string
): string {
  return `以下是${noteCount}条笔记的内容，请进行深度分析：

${dataOverview}

---

${notesText}`;
}

function calculateTimeSpan(earliest: Date, latest: Date): string {
  const diffMs = latest.getTime() - earliest.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '同一天';
  if (diffDays === 1) return '1天';
  if (diffDays <= 6) return `${diffDays}天`;
  if (diffDays <= 13) return '1周';
  if (diffDays <= 29) return `${Math.floor(diffDays / 7)}周`;
  if (diffDays <= 59) return '1个月';
  return `${Math.floor(diffDays / 30)}个月`;
}

function extractCommonTags(
  notes: Array<{ tags?: string[] }>
): string[] {
  const tagCount = new Map<string, number>();
  for (const note of notes) {
    if (!note.tags) continue;
    for (const tag of note.tags) {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
    }
  }
  return Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);
}

export function formatNotesForAnalysis(
  notes: Array<{ id: number; content: string; createdAt: string; title: string; tags?: string[]; type?: string }>
): { notesText: string; dataOverview: string } {
  const notesText = notes
    .map((n, i) => `[笔记 ${i + 1}] 标题: ${n.title} | 时间: ${n.createdAt}\n${n.content || '(无内容)'}`)
    .join('\n\n---\n\n');

  // Time span
  const timestamps = notes.map(n => new Date(n.createdAt).getTime());
  const earliest = new Date(Math.min(...timestamps));
  const latest = new Date(Math.max(...timestamps));
  const timeSpan = timestamps.length > 1
    ? calculateTimeSpan(earliest, latest)
    : '同一天';

  // Common tags
  const commonTags = extractCommonTags(notes);
  const tagsLine = commonTags.length > 0 ? commonTags.join('、') : '无';

  // Type distribution
  const typeCounts = new Map<string, number>();
  for (const note of notes) {
    const t = note.type || 'text';
    typeCounts.set(t, (typeCounts.get(t) || 0) + 1);
  }
  const typeDistribution = Array.from(typeCounts.entries())
    .map(([type, count]) => `${type}: ${count}条`)
    .join('、');

  const dataOverview = `# 分析任务

## 数据概览
- 笔记数量：${notes.length} 条
- 时间跨度：${timeSpan}
- 高频标签：${tagsLine}
- 笔记类型分布：${typeDistribution}`;

  return { notesText, dataOverview };
}
