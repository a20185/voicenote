export {
  isLLMConfigured,
  createChatCompletion,
  streamChatCompletion,
  getLLMProviderInfo,
  getLocalModelInfo,
} from './llmService';

export type { LocalLLMModelInfo, LocalLLMModelStatus } from './modelManager';
