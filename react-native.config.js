/**
 * React Native Configuration
 *
 * Configures local modules and CodeGen for the project.
 */

module.exports = {
  project: {
    ios: {},
    android: {},
  },
  dependencies: {
    // Local Moonshine module configuration
    'moonshine-module': {
      root: './modules/moonshine',
      platforms: {
        android: {
          sourceDir: './modules/moonshine',
          packageImportPath: 'import com.voicenote.modules.MoonshinePackage;',
          packageInstance: 'new MoonshinePackage()',
        },
        ios: {
          sourceDir: './modules/moonshine',
          // iOS implementation is in the main app target for SPM access
          // See: ios/voicenote/MoonshineModule.swift
        },
      },
    },
  },
};
