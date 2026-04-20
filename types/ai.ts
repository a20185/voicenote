export interface AITag {
  name: string;
  relevance: number;
}

export interface AIKeyInsight {
  content: string;
  type: 'pattern' | 'opportunity' | 'issue' | 'trend';
  confidence: number;
  evidence: string;
}

export interface AIActionItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'immediate' | 'short_term' | 'long_term';
  deadline?: string;
}

export interface AIMetadata {
  topicsIdentified: string[];
  emotionalTone: string;
  timeRange: string;
  noteCount: number;
}

export interface AISourceNote {
  id: number;
  title: string;
  preview: string;
}

export interface EnhancedAIAnalysisResult {
  summary: string;
  tags: AITag[];
  keyInsights: AIKeyInsight[];
  actionItems: AIActionItem[];
  metadata: AIMetadata;
}

export interface LegacyAIAnalysisResult {
  summary: string;
  tags: string[];
  keyInsights: string[];
  actionItems: string[];
}
