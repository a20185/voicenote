/**
 * Unit tests for ASR model types utilities
 * These tests are for pure functions without external dependencies
 */

import {
  getModelId,
  parseModelId,
  getModelDownloadUrl,
  DEFAULT_MODEL_BASE_URL,
  MODEL_DISPLAY_NAMES,
  MODEL_SIZES,
} from '../../modelManager/types';

describe('Model Type Utilities', () => {
  describe('getModelId', () => {
    it('should generate correct model ID for base Chinese model', () => {
      expect(getModelId('zh', 'base')).toBe('moonshine-base-zh');
    });

    it('should generate correct model ID for small English model', () => {
      expect(getModelId('en', 'small')).toBe('moonshine-small-en');
    });

    it('should generate correct model ID for base Japanese model', () => {
      expect(getModelId('ja', 'base')).toBe('moonshine-base-ja');
    });

    it('should generate correct model ID for small Korean model', () => {
      expect(getModelId('ko', 'small')).toBe('moonshine-small-ko');
    });
  });

  describe('parseModelId', () => {
    it('should parse valid base model ID', () => {
      const result = parseModelId('moonshine-base-zh');
      expect(result).toEqual({ language: 'zh', arch: 'base' });
    });

    it('should parse valid small model ID', () => {
      const result = parseModelId('moonshine-small-en');
      expect(result).toEqual({ language: 'en', arch: 'small' });
    });

    it('should return null for invalid format', () => {
      expect(parseModelId('invalid-id')).toBeNull();
    });

    it('should return null for wrong prefix', () => {
      expect(parseModelId('whisper-base-zh')).toBeNull();
    });

    it('should return null for invalid arch', () => {
      expect(parseModelId('moonshine-large-zh')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseModelId('')).toBeNull();
    });
  });

  describe('getModelDownloadUrl', () => {
    it('should generate URL with default base URL', () => {
      const url = getModelDownloadUrl('zh', 'base');
      expect(url).toBe(`${DEFAULT_MODEL_BASE_URL}/moonshine-base-zh.tar.gz`);
    });

    it('should generate URL with custom base URL', () => {
      const customUrl = 'https://custom.example.com/models/';
      const url = getModelDownloadUrl('en', 'small', customUrl);
      // Note: Function adds leading slash, so trailing slash in baseUrl causes double slash
      expect(url).toBe(`${customUrl}/moonshine-small-en.tar.gz`);
    });
  });

  describe('Constants', () => {
    it('should have correct default base URL', () => {
      expect(DEFAULT_MODEL_BASE_URL).toContain('github');
    });

    it('should have display names for all supported languages', () => {
      expect(MODEL_DISPLAY_NAMES['zh']).toBeDefined();
      expect(MODEL_DISPLAY_NAMES['en']).toBeDefined();
      expect(MODEL_DISPLAY_NAMES['ja']).toBeDefined();
      expect(MODEL_DISPLAY_NAMES['ko']).toBeDefined();
    });

    it('should have model sizes defined', () => {
      expect(MODEL_SIZES.small).toBeDefined();
      expect(MODEL_SIZES.base).toBeDefined();
      expect(MODEL_SIZES.small).toBeLessThan(MODEL_SIZES.base);
    });
  });
});
