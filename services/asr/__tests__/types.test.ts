/**
 * Tests for ASR type utilities
 */

import {
  getModelId,
  parseModelId,
  getModelDownloadUrl,
  DEFAULT_MODEL_BASE_URL,
} from '../modelManager/types';

describe('Model ID utilities', () => {
  describe('getModelId', () => {
    it('should generate correct model ID', () => {
      expect(getModelId('zh', 'base')).toBe('moonshine-base-zh');
      expect(getModelId('en', 'small')).toBe('moonshine-small-en');
      expect(getModelId('ja', 'base')).toBe('moonshine-base-ja');
    });
  });

  describe('parseModelId', () => {
    it('should parse valid model ID', () => {
      const result = parseModelId('moonshine-base-zh');
      expect(result).toEqual({ language: 'zh', arch: 'base' });
    });

    it('should parse small model ID', () => {
      const result = parseModelId('moonshine-small-en');
      expect(result).toEqual({ language: 'en', arch: 'small' });
    });

    it('should return null for invalid model ID', () => {
      expect(parseModelId('invalid-id')).toBeNull();
      expect(parseModelId('moonshine-invalid-zh')).toBeNull();
      expect(parseModelId('')).toBeNull();
    });
  });

  describe('getModelDownloadUrl', () => {
    it('should generate correct download URL', () => {
      const url = getModelDownloadUrl('zh', 'base');
      // Function adds '/' between baseUrl and filename
      expect(url).toBe(`${DEFAULT_MODEL_BASE_URL}/moonshine-base-zh.tar.gz`);
    });

    it('should use custom base URL', () => {
      const customUrl = 'https://custom.example.com';
      const url = getModelDownloadUrl('en', 'small', customUrl);
      // Function adds '/' between baseUrl and filename
      expect(url).toBe(`${customUrl}/moonshine-small-en.tar.gz`);
    });
  });
});
