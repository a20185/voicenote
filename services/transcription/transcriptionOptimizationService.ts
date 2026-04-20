import type { OptimizationLevel } from '@/types/transcription';
import { detectLanguage, buildFillerWordRegex } from './fillerWords';
import { OPTIMIZATION_SYSTEM_PROMPTS, buildOptimizationPrompt } from './prompts';
import { useSettingsStore } from '@/store';
import { createChatCompletion, isLLMConfigured } from '@/services/llm';

const LLM_TIMEOUT = 15000; // 15 seconds

function getAIConfig() {
  const { aiConfig } = useSettingsStore.getState();
  return {
    apiUrl: aiConfig.apiUrl || process.env.EXPO_PUBLIC_AI_API_URL || 'https://api.openai.com/v1',
    apiKey: aiConfig.apiKey || process.env.EXPO_PUBLIC_AI_API_KEY || '',
    model: aiConfig.model || process.env.EXPO_PUBLIC_AI_MODEL || 'gpt-4o-mini',
  };
}

export function isOptimizationConfigured(): boolean {
  return isLLMConfigured();
}

export function applyRuleCleanup(text: string, language?: string): string {
  const lang = language || detectLanguage(text);
  const regex = buildFillerWordRegex(lang);

  const result = text
    .replace(regex, '') // Remove filler words
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\s+([.,!?])/g, '$1') // Fix punctuation spacing
    .trim();

  return result;
}

export async function applyLLMOptimization(text: string, level: 'medium' | 'heavy'): Promise<string> {
  const { model } = getAIConfig();

  const systemPrompt = OPTIMIZATION_SYSTEM_PROMPTS[level];
  const userPrompt = buildOptimizationPrompt(text, level);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT);

  try {
    const data = await createChatCompletion({
      model,
      temperature: 0.2,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      signal: controller.signal,
    });

    return data.choices?.[0]?.message?.content || text;
  } finally {
    clearTimeout(timeout);
  }
}

export async function optimizeTranscription(
  text: string,
  level: OptimizationLevel,
  language?: string
): Promise<{ cleaned: string; optimized: string }> {
  // Step 1: Always apply rule-based cleanup
  const cleaned = applyRuleCleanup(text, language);

  // Step 2: For light, stop here
  if (level === 'light') {
    return { cleaned, optimized: cleaned };
  }

  // Step 3: For medium/heavy, apply LLM
  if (!isOptimizationConfigured()) {
    return { cleaned, optimized: cleaned }; // Fallback
  }

  try {
    const optimized = await applyLLMOptimization(cleaned, level);
    return { cleaned, optimized };
  } catch {
    // Fallback to cleaned version on error
    return { cleaned, optimized: cleaned };
  }
}
