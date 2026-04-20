// Mock for i18next
module.exports = {
  t: jest.fn((key) => key),
  language: 'en',
  languages: ['en', 'zh'],
  options: {},
  changeLanguage: jest.fn(),
  use: jest.fn(),
  init: jest.fn().mockResolvedValue(undefined),
};
