/**
 * Tests for BundledModels utilities
 */

import {
  BUNDLED_MODELS,
  isBundledModel,
  getBundledModels,
} from '../modelManager/BundledModels';

describe('BundledModels', () => {
  describe('BUNDLED_MODELS', () => {
    it('should be an array', () => {
      expect(Array.isArray(BUNDLED_MODELS)).toBe(true);
    });
  });

  describe('isBundledModel', () => {
    it('should return false for models not in BUNDLED_MODELS', () => {
      // Since BUNDLED_MODELS is empty by default
      expect(isBundledModel('zh', 'base')).toBe(false);
      expect(isBundledModel('en', 'small')).toBe(false);
    });
  });

  describe('getBundledModels', () => {
    it('should return array of bundled models', () => {
      const models = getBundledModels();
      expect(Array.isArray(models)).toBe(true);
      // Empty by default
      expect(models.length).toBe(0);
    });
  });
});
