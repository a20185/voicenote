export const FILLER_WORDS: Record<string, string[]> = {
  'zh': ['嗯', '啊', '呃', '那个', '然后', '就是', '其实', '所以说', '对吧', '是吧', '的话', '一个', '可能'],
  'en': ['um', 'uh', 'like', 'you know', 'i mean', 'basically', 'actually', 'literally', 'right', 'so'],
  'ja': ['えーと', 'あのー', 'そのー', 'まあ', 'なんか', 'ですね'],
  'ko': ['음', '어', '그', '저', '뭐냐', '그니까'],
};

export function detectLanguage(text: string): string {
  // Detect based on character patterns
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  return 'en';
}

export function buildFillerWordRegex(language: string): RegExp {
  const words = FILLER_WORDS[language] || FILLER_WORDS['en'];
  const pattern = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return new RegExp(`\\b(${pattern})\\b`, 'gi');
}
