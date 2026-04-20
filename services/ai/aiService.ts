import type {
  EnhancedAIAnalysisResult,
  AITag,
  AIKeyInsight,
  AIActionItem,
  AIMetadata,
} from '@/types/ai';
import { ANALYSIS_SYSTEM_PROMPT, buildUserPrompt, formatNotesForAnalysis } from './prompts';
import { useSettingsStore } from '@/store';
import { createChatCompletion, isLLMConfigured } from '@/services/llm';

export type { EnhancedAIAnalysisResult };

// Re-export legacy type for backward compat
export type AIAnalysisResult = EnhancedAIAnalysisResult;

const DEFAULT_API_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';
const TIMEOUT_MS = 60000;

function getAIConfig() {
  const { aiConfig } = useSettingsStore.getState();
  return {
    apiUrl: aiConfig.apiUrl || process.env.EXPO_PUBLIC_AI_API_URL || DEFAULT_API_URL,
    apiKey: aiConfig.apiKey || process.env.EXPO_PUBLIC_AI_API_KEY || '',
    model: aiConfig.model || process.env.EXPO_PUBLIC_AI_MODEL || DEFAULT_MODEL,
  };
}

export function isAIConfigured(): boolean {
  return isLLMConfigured();
}

function extractJSON(text: string): string {
  // Handle markdown code block wrapping
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  // Try to find JSON object directly
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  return text.trim();
}

function normalizeTag(tag: unknown): AITag | null {
  if (typeof tag === 'string') {
    return { name: tag, relevance: 0.7 };
  }
  if (tag && typeof tag === 'object' && 'name' in tag) {
    const t = tag as Record<string, unknown>;
    return {
      name: String(t.name),
      relevance: typeof t.relevance === 'number' ? t.relevance : 0.7,
    };
  }
  return null;
}

function normalizeInsight(insight: unknown): AIKeyInsight | null {
  if (typeof insight === 'string') {
    return { content: insight, type: 'pattern', confidence: 0.7, evidence: '' };
  }
  if (insight && typeof insight === 'object' && 'content' in insight) {
    const i = insight as Record<string, unknown>;
    return {
      content: String(i.content),
      type: (['pattern', 'opportunity', 'issue', 'trend'].includes(String(i.type)) ? String(i.type) : 'pattern') as AIKeyInsight['type'],
      confidence: typeof i.confidence === 'number' ? i.confidence : 0.7,
      evidence: typeof i.evidence === 'string' ? i.evidence : '',
    };
  }
  return null;
}

function normalizeAction(action: unknown): AIActionItem | null {
  if (typeof action === 'string') {
    return { title: action, description: '', priority: 'medium', category: 'short_term' };
  }
  if (action && typeof action === 'object' && 'title' in action) {
    const a = action as Record<string, unknown>;
    return {
      title: String(a.title),
      description: typeof a.description === 'string' ? a.description : '',
      priority: (['high', 'medium', 'low'].includes(String(a.priority)) ? String(a.priority) : 'medium') as AIActionItem['priority'],
      category: (['immediate', 'short_term', 'long_term'].includes(String(a.category)) ? String(a.category) : 'short_term') as AIActionItem['category'],
      deadline: typeof a.deadline === 'string' ? a.deadline : undefined,
    };
  }
  return null;
}

export function normalizeAIResponse(parsed: Record<string, unknown>): EnhancedAIAnalysisResult {
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.map(normalizeTag).filter((t): t is AITag => t !== null)
    : [];

  const keyInsights = Array.isArray(parsed.keyInsights)
    ? parsed.keyInsights.map(normalizeInsight).filter((i): i is AIKeyInsight => i !== null)
    : [];

  const actionItems = Array.isArray(parsed.actionItems)
    ? parsed.actionItems.map(normalizeAction).filter((a): a is AIActionItem => a !== null)
    : [];

  const rawMeta = (parsed.metadata && typeof parsed.metadata === 'object') ? parsed.metadata as Record<string, unknown> : {};

  const metadata: AIMetadata = {
    topicsIdentified: Array.isArray(rawMeta.topicsIdentified) ? rawMeta.topicsIdentified.map(String) : [],
    emotionalTone: typeof rawMeta.emotionalTone === 'string' ? rawMeta.emotionalTone : '',
    timeRange: typeof rawMeta.timeRange === 'string' ? rawMeta.timeRange : '',
    noteCount: typeof rawMeta.noteCount === 'number' ? rawMeta.noteCount : 0,
  };

  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    tags,
    keyInsights,
    actionItems,
    metadata,
  };
}

export async function analyzeNotes(
  notes: Array<{ id: number; content: string; createdAt: string; title: string; tags?: string[]; type?: string }>
): Promise<EnhancedAIAnalysisResult> {
  const { model } = getAIConfig();

  const { notesText, dataOverview } = formatNotesForAnalysis(notes);
  const userPrompt = buildUserPrompt(notesText, notes.length, dataOverview);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const data = await createChatCompletion({
      model,
      temperature: 0.4,
      max_tokens: 1500,
      messages: [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      signal: controller.signal,
    });

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from AI API');
    }

    const jsonStr = extractJSON(content);
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

    return normalizeAIResponse(parsed);
  } finally {
    clearTimeout(timeout);
  }
}
