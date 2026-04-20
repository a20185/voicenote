# Bundled Models

This directory contains bundled ASR models that ship with the app.

## Why Bundle Models?

Bundling a default model provides:
- **Offline-first experience**: Users can use speech recognition immediately without downloading
- **Better UX**: No initial setup required for the primary use case
- **Reduced server costs**: Fewer model downloads needed

## Model Files

Each model requires three files:
- `encoder_model.ort` - Encoder ONNX model
- `decoder_model_merged.ort` - Decoder ONNX model
- `tokenizer.bin` - Tokenizer binary

## How to Add a Bundled Model

### Step 1: Download Model Files

Download the model files from the release page:
```
https://github.com/nickyoung-github/moonshine-models/releases/download/v0.0.49/
```

For Chinese base model:
```bash
# Download and extract
wget https://github.com/nickyoung-github/moonshine-models/releases/download/v0.0.49/moonshine-base-zh.tar.gz
tar -xzf moonshine-base-zh.tar.gz
```

### Step 2: Place Files in Assets

Create the model directory and copy files:
```bash
mkdir -p assets/models/moonshine-base-zh
cp moonshine-base-zh/encoder_model.ort assets/models/moonshine-base-zh/
cp moonshine-base-zh/decoder_model_merged.ort assets/models/moonshine-base-zh/
cp moonshine-base-zh/tokenizer.bin assets/models/moonshine-base-zh/
```

### Step 3: Configure Bundled Model

Edit `services/asr/modelManager/BundledModels.ts` and uncomment/add the model configuration:

```typescript
export const BUNDLED_MODELS: BundledModelConfig[] = [
  {
    language: 'zh',
    arch: 'base',
    assetFiles: [
      'encoder_model.ort',
      'decoder_model_merged.ort',
      'tokenizer.bin',
    ],
  },
];
```

### Step 4: Configure Expo Metro Bundler

For Expo to include large binary files, you may need to update `metro.config.js`:

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Include model files in the bundle
config.assetExts.push('ort', 'bin');

module.exports = config;
```

### Step 5: Update app.json for Asset Inclusion

Add the model files to `app.json`:

```json
{
  "expo": {
    "assetBundlePatterns": [
      "assets/**/*"
    ]
  }
}
```

## Model Sizes

| Model | Size | Languages |
|-------|------|-----------|
| moonshine-small-* | ~50MB | zh, en, ja, ko, ar, es, vi, uk |
| moonshine-base-* | ~150MB | zh, en, ja, ko, ar, es, vi, uk |

## Recommendations

- **Bundle only one model**: To minimize app size, bundle only the most commonly used model
- **Chinese default**: If your primary users are Chinese speakers, bundle `moonshine-base-zh`
- **English default**: If your primary users are English speakers, bundle `moonshine-base-en`
- **Small vs Base**: Small models are faster but less accurate; Base models are more accurate but slower

## Building with Bundled Models

### iOS
The model files will be included in the app bundle and extracted on first launch.

### Android
The model files will be included in the assets and extracted on first launch.

Note: APK size will increase by the model size. Consider using Android App Bundles (AAB) for automatic optimization.

## Testing Bundled Models

1. Build the app with the bundled model
2. Uninstall any previous versions
3. Launch the app in airplane mode
4. Navigate to Settings > ASR Config > Local
5. Verify the model shows as "Downloaded" without needing to download
