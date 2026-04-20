import type { OptimizationLevel } from '@/types/transcription';

export const OPTIMIZATION_SYSTEM_PROMPTS: Record<OptimizationLevel, string> = {
  light: '', // No LLM for light
  medium: `You are a text editor. Clean up the transcription by:
- Fixing punctuation and capitalization
- Removing unnecessary repetitions
- Improving sentence flow slightly
- Keep original meaning and tone
Output ONLY the improved text, no explanations.`,

  heavy: `You are a professional editor. Transform this transcription into polished text:
- Fix all grammar and punctuation
- Remove filler words and hesitations
- Improve clarity and flow
- Organize into proper paragraphs
- Maintain original meaning
Output ONLY the polished text, no explanations.`,
};

export function buildOptimizationPrompt(text: string, _level: OptimizationLevel): string {
  return `Please optimize the following transcription:\n\n${text}`;
}
