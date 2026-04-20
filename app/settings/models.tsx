import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, Pressable, Alert } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  Download, Trash2, Check, RefreshCw,
  HardDrive, Globe, AlertCircle
} from 'lucide-react-native';
import {
  isModelDownloaded,
  deleteModel,
  downloadModel,
  cancelDownload,
  getDownloadStatus,
  MODEL_DISPLAY_NAMES,
  MODEL_SIZES,
  formatSize,
  type DownloadProgressCallback,
} from '@/services/asr';
import type { MoonshineLanguage, ModelArch, ModelStatus } from '@/types/asr';

interface ModelItem {
  language: MoonshineLanguage;
  arch: ModelArch;
  name: string;
  size: number;
  status: 'not_downloaded' | 'downloading' | 'extracting' | 'downloaded' | 'error';
  progress?: number;
  error?: string;
}

export default function ModelsManagementScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation(['settings', 'common']);

  const [models, setModels] = useState<ModelItem[]>([]);
  const [, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const availableModels: Array<{ language: MoonshineLanguage; arch: ModelArch }> = [
    { language: 'zh', arch: 'small' },
    { language: 'zh', arch: 'base' },
    { language: 'en', arch: 'small' },
    { language: 'en', arch: 'base' },
    { language: 'ja', arch: 'small' },
    { language: 'ja', arch: 'base' },
    { language: 'ko', arch: 'small' },
    { language: 'ko', arch: 'base' },
  ];

  const loadModels = useCallback(async () => {
    try {
      const modelItems: ModelItem[] = await Promise.all(
        availableModels.map(async ({ language, arch }) => {
          const downloaded = await isModelDownloaded(language, arch);
          const downloadStatus = getDownloadStatus(language, arch);

          let status: ModelItem['status'] = 'not_downloaded';
          let progress: number | undefined;
          let error: string | undefined;

          if (downloaded) {
            status = 'downloaded';
          } else if (downloadStatus) {
            status = downloadStatus.status as ModelItem['status'];
            progress = downloadStatus.progress;
            error = downloadStatus.error;
          }

          return {
            language,
            arch,
            name: `${MODEL_DISPLAY_NAMES[language] || language.toUpperCase()} (${arch})`,
            size: MODEL_SIZES[arch] || 0,
            status: downloadStatus?.error ? 'error' : status,
            progress,
            error,
          };
        })
      );

      setModels(modelItems);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const handleDownload = async (language: MoonshineLanguage, arch: ModelArch) => {
    const modelId = `moonshine-${arch}-${language}`;
    setDownloadingId(modelId);

    const onProgress: DownloadProgressCallback = (progress: number, status: ModelStatus) => {
      setModels(prev => prev.map(m =>
        m.language === language && m.arch === arch
          ? { ...m, progress, status: status as ModelItem['status'] }
          : m
      ));
    };

    try {
      await downloadModel({
        language,
        arch,
        onProgress,
      });
      await loadModels();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download failed';
      Alert.alert(t('downloadFailed'), message);
      setModels(prev => prev.map(m =>
        m.language === language && m.arch === arch
          ? { ...m, status: 'error', error: message }
          : m
      ));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCancelDownload = async (language: MoonshineLanguage, arch: ModelArch) => {
    try {
      await cancelDownload(language, arch);
      await loadModels();
    } catch (error) {
      console.error('Failed to cancel download:', error);
    }
  };

  const handleDelete = async (language: MoonshineLanguage, arch: ModelArch) => {
    Alert.alert(
      t('deleteModelTitle'),
      t('deleteModelMessage'),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('common:delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteModel(language, arch);
              await loadModels();
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Delete failed';
              Alert.alert(t('deleteFailed'), message);
            }
          },
        },
      ]
    );
  };

  const iconColor = isDark ? '#9ca3af' : '#6b7280';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t('asrModelManagement'),
          headerBackTitle: t('common:back'),
          headerStyle: { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' },
          headerTintColor: isDark ? '#e5e7eb' : '#111827',
        }}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Info Banner */}
        <YStack
          padding={12}
          borderRadius={12}
          backgroundColor={isDark ? '#1f2937' : '#f3f4f6'}
          marginBottom={16}
        >
          <XStack alignItems="center" gap={8}>
            <HardDrive size={16} color={iconColor} />
            <Text fontSize={13} color={isDark ? '#9ca3af' : '#6b7280'}>
              {t('modelsStorageInfo')}
            </Text>
          </XStack>
        </YStack>

        {/* Models List */}
        <YStack gap={8}>
          {models.map((model) => {
            const isDownloading = model.status === 'downloading' || model.status === 'extracting';
            const isDownloaded = model.status === 'downloaded';
            const hasError = model.status === 'error';
            const modelId = `moonshine-${model.arch}-${model.language}`;

            return (
              <YStack
                key={modelId}
                padding={16}
                borderRadius={12}
                backgroundColor={isDark ? '#1f2937' : '#f3f4f6'}
                gap={12}
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack flex={1}>
                    <XStack alignItems="center" gap={8}>
                      <Globe size={16} color={iconColor} />
                      <Text fontSize={15} fontWeight="500" color={isDark ? '#e5e7eb' : '#111827'}>
                        {model.name}
                      </Text>
                    </XStack>
                    <Text fontSize={12} color={isDark ? '#9ca3af' : '#6b7280'} marginTop={4}>
                      {formatSize(model.size)}
                    </Text>
                  </YStack>

                  {isDownloaded && (
                    <XStack gap={8} alignItems="center">
                      <Check size={18} color="#22c55e" />
                      <Pressable
                        onPress={() => handleDelete(model.language, model.arch)}
                        style={{ padding: 8 }}
                      >
                        <Trash2 size={18} color={isDark ? '#ef4444' : '#dc2626'} />
                      </Pressable>
                    </XStack>
                  )}

                  {isDownloading && (
                    <XStack gap={8} alignItems="center">
                      <Text fontSize={13} color={isDark ? '#9ca3af' : '#6b7280'}>
                        {Math.round(model.progress || 0)}%
                      </Text>
                      <Pressable
                        onPress={() => handleCancelDownload(model.language, model.arch)}
                        style={{ padding: 8 }}
                      >
                        <RefreshCw size={18} color={isDark ? '#f59e0b' : '#d97706'} />
                      </Pressable>
                    </XStack>
                  )}

                  {!isDownloaded && !isDownloading && (
                    <Pressable
                      onPress={() => handleDownload(model.language, model.arch)}
                      disabled={downloadingId !== null}
                      style={{
                        padding: 8,
                        opacity: downloadingId !== null ? 0.5 : 1,
                      }}
                    >
                      <Download size={18} color={isDark ? '#3b82f6' : '#2563eb'} />
                    </Pressable>
                  )}
                </XStack>

                {/* Progress Bar */}
                {isDownloading && (
                  <YStack height={4} borderRadius={2} backgroundColor={isDark ? '#374151' : '#e5e7eb'}>
                    <YStack
                      height="100%"
                      borderRadius={2}
                      backgroundColor="#3b82f6"
                      width={`${model.progress || 0}%`}
                    />
                  </YStack>
                )}

                {/* Error Message */}
                {hasError && (
                  <XStack alignItems="center" gap={8}>
                    <AlertCircle size={14} color={isDark ? '#ef4444' : '#dc2626'} />
                    <Text fontSize={12} color={isDark ? '#ef4444' : '#dc2626'}>
                      {model.error}
                    </Text>
                  </XStack>
                )}
              </YStack>
            );
          })}
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
