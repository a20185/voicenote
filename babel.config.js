module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': '.',
            '@components': './components',
            '@hooks': './hooks',
            '@services': './services',
            '@store': './store',
            '@db': './db',
            '@theme': './theme',
            '@types': './types',
            '@utils': './utils',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
