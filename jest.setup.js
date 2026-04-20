// Jest setup file

// Suppress console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Bundled')) {
    return;
  }
  originalWarn(...args);
};
