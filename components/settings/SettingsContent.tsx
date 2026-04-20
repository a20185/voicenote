import React from 'react';
import { ScrollView, Alert, Pressable, TextInput, StyleSheet } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import i18n, { supportedLanguages } from '@/i18n';
import {
  Globe, AudioLines, Sparkles, Puzzle, Wand2,
  CheckCircle2, ChevronRight,
  ToggleLeft, ToggleRight, Cloud, HardDrive,
  Plus,
} from 'lucide-react-native';
import { useSettingsStore } from '@/store/useSettingsStore';
import { spacing } from '@/theme/spacing';
import { CollapsibleSection } from './CollapsibleSection';
import { SettingsInputField } from './SettingsInputField';
import { SkillItemRow } from './SkillItemRow';
import { isValidSkillUrl, loadSkill } from '@/services/skill';
import { getLocalModelInfo, type LocalLLMModelInfo } from '@/services/llm';
import type { ASRConfig, AIConfig, Skill, OptimizationLevel } from '@/types/settings';
import type { MoonshineLanguage, ModelArch } from '@/types/asr';
import { MODEL_DISPLAY_NAMES } from '@/services/asr';

interface SettingsContentProps {
  localASR: ASRConfig;
  setLocalASR: React.Dispatch<React.SetStateAction<ASRConfig>>;
  localAI: AIConfig;
  setLocalAI: React.Dispatch<React.SetStateAction<AIConfig>>;
  localSkillsEnabled: boolean;
  setLocalSkillsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  localSkills: Skill[];
  setLocalSkills: React.Dispatch<React.SetStateAction<Skill[]>>;
  localOptimizationEnabled: boolean;
  setLocalOptimizationEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  localOptimizationLevel: OptimizationLevel;
  setLocalOptimizationLevel: React.Dispatch<React.SetStateAction<OptimizationLevel>>;
  onClose?: () => void;
}

// Light theme colors
const iconColor = '#6b7280';
const iconSize = 16;

export function SettingsContent({
  localASR,
  setLocalASR,
  localAI,
  setLocalAI,
  localSkillsEnabled,
  setLocalSkillsEnabled,
  localSkills,
  setLocalSkills,
  localOptimizationEnabled,
  setLocalOptimizationEnabled,
  localOptimizationLevel,
  setLocalOptimizationLevel,
  onClose,
}: SettingsContentProps) {
  const { t } = useTranslation(['settings', 'common', 'optimization']);
  const router = useRouter();
  const store = useSettingsStore();
  const aiProvider = localAI.provider || 'cloud';
  const [localModelInfo, setLocalModelInfo] = React.useState<LocalLLMModelInfo>({
    status: 'missing',
    source: 'custom',
    filename: 'Qwen3.5-0.8B-UD-Q4_K_XL.gguf',
  });
  const [isCheckingLocalModel, setIsCheckingLocalModel] = React.useState(false);

  const refreshLocalModelInfo = React.useCallback(async (prepareBundled: boolean) => {
    setIsCheckingLocalModel(true);
    try {
      const info = await getLocalModelInfo({ prepareBundled });
      setLocalModelInfo(info);
    } catch (error) {
      setLocalModelInfo({
        status: 'error',
        source: 'custom',
        filename: 'Qwen3.5-0.8B-UD-Q4_K_XL.gguf',
        error: error instanceof Error ? error.message : 'Failed to inspect local model',
      });
    } finally {
      setIsCheckingLocalModel(false);
    }
  }, []);

  React.useEffect(() => {
    if (aiProvider === 'local') {
      refreshLocalModelInfo(true);
    }
  }, [aiProvider, refreshLocalModelInfo]);

  const handleLanguageChange = (langCode: string) => {
    store.setLanguage(langCode);
    i18n.changeLanguage(langCode);
  };

  const handleAddSkill = async (newSkillUrl: string, setNewSkillUrl: (v: string) => void, setAddingSkill: (v: boolean) => void) => {
    if (!newSkillUrl.trim()) return;
    if (!isValidSkillUrl(newSkillUrl.trim())) {
      Alert.alert(t('skillInvalidUrl'));
      return;
    }
    setAddingSkill(true);
    try {
      const loaded = await loadSkill(newSkillUrl.trim());
      const skill: Skill = { ...loaded, id: Date.now().toString() };
      setLocalSkills((prev) => [...prev, skill]);
      setNewSkillUrl('');
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert(message);
    } finally {
      setAddingSkill(false);
    }
  };

  const handleReloadSkill = async (id: string) => {
    setLocalSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'loading' as const } : s))
    );
    const skill = localSkills.find((s) => s.id === id);
    if (!skill) return;
    try {
      const loaded = await loadSkill(skill.url);
      setLocalSkills((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...loaded, status: 'loaded' as const, error: undefined } : s))
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setLocalSkills((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'error' as const, error: message } : s))
      );
    }
  };

  const handleRemoveSkill = (id: string) => {
    setLocalSkills((prev) => prev.filter((s) => s.id !== id));
  };

  const SettingRow = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
    <XStack justifyContent="space-between" alignItems="center" paddingVertical={spacing[3]}>
      <YStack flex={1}>
        <Text fontSize={15} fontWeight="500" color="#111827">{title}</Text>
        {subtitle && <Text fontSize={13} color="#6b7280">{subtitle}</Text>}
      </YStack>
      {children}
    </XStack>
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Language */}
      <CollapsibleSection icon={<Globe size={iconSize} color={iconColor} />} title={t('language')} defaultExpanded>
        <YStack gap={8}>
          {supportedLanguages.map((lang) => {
            const isSelected = (store.language || i18n.language) === lang.code;
            return (
              <Pressable
                key={lang.code}
                onPress={() => handleLanguageChange(lang.code)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isSelected ? '#111827' : '#f3f4f6',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <Text fontSize={15} fontWeight={isSelected ? '600' : '400'} color={isSelected ? '#ffffff' : '#374151'}>
                  {lang.nativeName}
                </Text>
                {isSelected && <CheckCircle2 size={18} color="#ffffff" />}
              </Pressable>
            );
          })}
        </YStack>
      </CollapsibleSection>

      {/* ASR Config */}
      <CollapsibleSection icon={<AudioLines size={iconSize} color={iconColor} />} title={t('asrConfig')} defaultExpanded>
        <YStack gap={12}>
          {/* Provider Type Selection */}
          <YStack gap={8}>
            <Text fontSize={13} fontWeight="500" color="#6b7280">{t('asrProviderType')}</Text>
            <XStack gap={8}>
              <Pressable
                onPress={() => {
                  setLocalASR((p) => ({ ...p, provider: 'cloud' }));
                  store.setASRProvider('cloud');
                }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: localASR.provider === 'cloud' ? '#111827' : '#f3f4f6',
                }}
              >
                <Cloud size={18} color={localASR.provider === 'cloud' ? '#ffffff' : '#6b7280'} />
                <Text fontSize={14} fontWeight={localASR.provider === 'cloud' ? '600' : '400'} color={localASR.provider === 'cloud' ? '#ffffff' : '#374151'}>
                  {t('asrProviderCloud')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setLocalASR((p) => ({ ...p, provider: 'local' }));
                  store.setASRProvider('local');
                }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: localASR.provider === 'local' ? '#111827' : '#f3f4f6',
                }}
              >
                <HardDrive size={18} color={localASR.provider === 'local' ? '#ffffff' : '#6b7280'} />
                <Text fontSize={14} fontWeight={localASR.provider === 'local' ? '600' : '400'} color={localASR.provider === 'local' ? '#ffffff' : '#374151'}>
                  {t('asrProviderLocal')}
                </Text>
              </Pressable>
            </XStack>
          </YStack>

          {/* Cloud Settings */}
          {localASR.provider === 'cloud' && (
            <YStack gap={12}>
              <SettingsInputField
                label={t('asrApiEndpoint')}
                value={localASR.apiUrl}
                onChangeText={(v) => setLocalASR((p) => ({ ...p, apiUrl: v }))}
                placeholder="https://api.example.com/v1/audio"
              />
              <SettingsInputField
                label={t('asrApiKey')}
                value={localASR.apiKey}
                onChangeText={(v) => setLocalASR((p) => ({ ...p, apiKey: v }))}
                placeholder="sk-..."
                secureTextEntry
              />
            </YStack>
          )}

          {/* Local Settings */}
          {localASR.provider === 'local' && (
            <YStack gap={12}>
              {/* Language Selection */}
              <YStack gap={8}>
                <Text fontSize={13} fontWeight="500" color="#6b7280">{t('asrDefaultLanguage')}</Text>
                <XStack gap={8} flexWrap="wrap">
                  {(['zh', 'en', 'ja', 'ko'] as MoonshineLanguage[]).map((lang) => (
                    <Pressable
                      key={lang}
                      onPress={() => setLocalASR((p) => ({ ...p, defaultLanguage: lang }))}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: localASR.defaultLanguage === lang ? '#111827' : '#f3f4f6',
                      }}
                    >
                      <Text fontSize={14} fontWeight={localASR.defaultLanguage === lang ? '600' : '400'} color={localASR.defaultLanguage === lang ? '#ffffff' : '#374151'}>
                        {MODEL_DISPLAY_NAMES[lang] || lang.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </XStack>
              </YStack>

              {/* Model Architecture Selection */}
              <YStack gap={8}>
                <Text fontSize={13} fontWeight="500" color="#6b7280">{t('asrModelArch')}</Text>
                <XStack gap={8}>
                  {(['small', 'base'] as ModelArch[]).map((arch) => (
                    <Pressable
                      key={arch}
                      onPress={() => setLocalASR((p) => ({ ...p, defaultModelArch: arch }))}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 8,
                        alignItems: 'center',
                        backgroundColor: localASR.defaultModelArch === arch ? '#111827' : '#f3f4f6',
                      }}
                    >
                      <Text fontSize={14} fontWeight={localASR.defaultModelArch === arch ? '600' : '400'} color={localASR.defaultModelArch === arch ? '#ffffff' : '#374151'}>
                        {arch === 'small' ? t('asrModelSmall') : t('asrModelBase')}
                      </Text>
                      <Text fontSize={11} color={localASR.defaultModelArch === arch ? '#d1d5db' : '#6b7280'}>
                        {arch === 'small' ? '~50MB' : '~150MB'}
                      </Text>
                    </Pressable>
                  ))}
                </XStack>
              </YStack>

              {/* Model Management Link */}
              <Pressable
                onPress={() => {
                  onClose?.();
                  router.push('/settings/models');
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: '#f3f4f6',
                }}
              >
                <Text fontSize={14} fontWeight="500" color="#374151">
                  {t('asrModelManagement')}
                </Text>
                <ChevronRight size={18} color="#6b7280" />
              </Pressable>

            </YStack>
          )}
        </YStack>
      </CollapsibleSection>

      {/* AI Config */}
      <CollapsibleSection icon={<Sparkles size={iconSize} color={iconColor} />} title={t('aiConfig')} defaultExpanded>
        <YStack gap={12}>
          <YStack gap={8}>
            <Text fontSize={13} fontWeight="500" color="#6b7280">{t('aiProviderType')}</Text>
            <XStack gap={8}>
              <Pressable
                onPress={() => setLocalAI((p) => ({ ...p, provider: 'cloud' }))}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: aiProvider === 'cloud' ? '#111827' : '#f3f4f6',
                }}
              >
                <Cloud size={18} color={aiProvider === 'cloud' ? '#ffffff' : '#6b7280'} />
                <Text fontSize={14} fontWeight={aiProvider === 'cloud' ? '600' : '400'} color={aiProvider === 'cloud' ? '#ffffff' : '#374151'}>
                  {t('aiProviderCloud')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setLocalAI((p) => ({ ...p, provider: 'local' }))}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: aiProvider === 'local' ? '#111827' : '#f3f4f6',
                }}
              >
                <HardDrive size={18} color={aiProvider === 'local' ? '#ffffff' : '#6b7280'} />
                <Text fontSize={14} fontWeight={aiProvider === 'local' ? '600' : '400'} color={aiProvider === 'local' ? '#ffffff' : '#374151'}>
                  {t('aiProviderLocal')}
                </Text>
              </Pressable>
            </XStack>
          </YStack>

          {aiProvider === 'cloud' && (
            <YStack gap={12}>
              <SettingsInputField
                label={t('aiApiEndpoint')}
                value={localAI.apiUrl}
                onChangeText={(v) => setLocalAI((p) => ({ ...p, apiUrl: v }))}
                placeholder="https://api.openai.com/v1"
              />
              <SettingsInputField
                label={t('aiApiKey')}
                value={localAI.apiKey}
                onChangeText={(v) => setLocalAI((p) => ({ ...p, apiKey: v }))}
                placeholder="sk-..."
                secureTextEntry
              />
              <SettingsInputField
                label={t('aiModel')}
                value={localAI.model}
                onChangeText={(v) => setLocalAI((p) => ({ ...p, model: v }))}
                placeholder="gpt-4o-mini"
              />
            </YStack>
          )}

          {aiProvider === 'local' && (
            <YStack
              gap={8}
              paddingHorizontal={12}
              paddingVertical={12}
              borderRadius={12}
              backgroundColor="#f3f4f6"
            >
              <Text fontSize={14} fontWeight="600" color="#111827">
                {t('aiLocalModel')}
              </Text>
              <Text fontSize={13} color="#4b5563">
                {isCheckingLocalModel
                  ? t('aiLocalModelPreparing')
                  : localModelInfo.status === 'ready'
                    ? t('aiLocalModelReady')
                    : localModelInfo.status === 'missing'
                      ? t('aiLocalModelMissing')
                      : t('aiLocalModelError')}
              </Text>
              <Text fontSize={12} color="#6b7280">
                {localModelInfo.filename}
              </Text>
              {localModelInfo.error && (
                <Text fontSize={12} color="#b91c1c">
                  {localModelInfo.error}
                </Text>
              )}
              <Pressable
                onPress={() => refreshLocalModelInfo(true)}
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: '#111827',
                  opacity: isCheckingLocalModel ? 0.6 : 1,
                }}
                disabled={isCheckingLocalModel}
              >
                <Text fontSize={12} fontWeight="500" color="#ffffff">{t('aiLocalModelRetry')}</Text>
              </Pressable>
            </YStack>
          )}
        </YStack>
      </CollapsibleSection>

      {/* Transcription Optimization */}
      <CollapsibleSection icon={<Wand2 size={iconSize} color={iconColor} />} title={t('optimizationConfig')} defaultExpanded>
        <YStack gap={12}>
          <SettingRow title={t('optimizationEnabled')}>
            <Pressable onPress={() => setLocalOptimizationEnabled(!localOptimizationEnabled)} hitSlop={8}>
              {localOptimizationEnabled ? (
                <ToggleRight size={40} color="#111827" />
              ) : (
                <ToggleLeft size={40} color="#d1d5db" />
              )}
            </Pressable>
          </SettingRow>

          {localOptimizationEnabled && (
            <YStack gap={8}>
              {(['light', 'medium', 'heavy'] as const).map((level) => (
                <Pressable
                  key={level}
                  onPress={() => setLocalOptimizationLevel(level)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: localOptimizationLevel === level ? '#111827' : '#f3f4f6',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                  }}
                >
                  <YStack>
                    <Text fontSize={15} fontWeight={localOptimizationLevel === level ? '600' : '400'} color={localOptimizationLevel === level ? '#ffffff' : '#374151'}>
                      {t(`optimizationLevel${level.charAt(0).toUpperCase() + level.slice(1)}`)}
                    </Text>
                    <Text fontSize={12} color={localOptimizationLevel === level ? '#d1d5db' : '#6b7280'}>
                      {t(`optimizationLevel${level.charAt(0).toUpperCase() + level.slice(1)}Desc`)}
                    </Text>
                  </YStack>
                  {localOptimizationLevel === level && <CheckCircle2 size={18} color="#ffffff" />}
                </Pressable>
              ))}
            </YStack>
          )}
        </YStack>
      </CollapsibleSection>

      {/* Skills */}
      <CollapsibleSection icon={<Puzzle size={iconSize} color={iconColor} />} title={t('skillsConfig')} defaultExpanded>
        <SkillsSection
          localSkillsEnabled={localSkillsEnabled}
          setLocalSkillsEnabled={setLocalSkillsEnabled}
          localSkills={localSkills}
          onAddSkill={handleAddSkill}
          onReloadSkill={handleReloadSkill}
          onRemoveSkill={handleRemoveSkill}
          t={t}
        />
      </CollapsibleSection>

      {/* App Info */}
      <YStack alignItems="center" gap={spacing[2]} paddingVertical={spacing[4]}>
        <Text fontSize={14} color="#a1a1aa">{t('appVersion')}</Text>
        <Text fontSize={12} color="#a1a1aa">{t('madeWith')}</Text>
      </YStack>
    </ScrollView>
  );
}

// Separate component for Skills section to manage its own input state
function SkillsSection({
  localSkillsEnabled,
  setLocalSkillsEnabled,
  localSkills,
  onAddSkill,
  onReloadSkill,
  onRemoveSkill,
  t,
}: {
  localSkillsEnabled: boolean;
  setLocalSkillsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  localSkills: Skill[];
  onAddSkill: (url: string, setUrl: (v: string) => void, setAdding: (v: boolean) => void) => void;
  onReloadSkill: (id: string) => void;
  onRemoveSkill: (id: string) => void;
  t: (key: string) => string;
}) {
  const [newSkillUrl, setNewSkillUrl] = React.useState('');
  const [addingSkill, setAddingSkill] = React.useState(false);

  const SettingRow = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <XStack justifyContent="space-between" alignItems="center" paddingVertical={spacing[3]}>
      <Text fontSize={15} fontWeight="500" color="#111827">{title}</Text>
      {children}
    </XStack>
  );

  return (
    <YStack gap={12}>
      <SettingRow title={t('skillsEnabled')}>
        <Pressable onPress={() => setLocalSkillsEnabled(!localSkillsEnabled)} hitSlop={8}>
          {localSkillsEnabled ? (
            <ToggleRight size={40} color="#111827" />
          ) : (
            <ToggleLeft size={40} color="#d1d5db" />
          )}
        </Pressable>
      </SettingRow>

      {localSkillsEnabled && (
        <>
          <YStack gap={8}>
            <Text fontSize={13} fontWeight="500" color="#6b7280">{t('addSkill')}</Text>
            <XStack gap={8} alignItems="center">
              <TextInput
                style={[
                  styles.skillInput,
                  { backgroundColor: '#f3f4f6', color: '#111827' },
                ]}
                value={newSkillUrl}
                onChangeText={setNewSkillUrl}
                placeholder={t('addSkillPlaceholder')}
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                onPress={() => onAddSkill(newSkillUrl, setNewSkillUrl, setAddingSkill)}
                disabled={addingSkill}
                style={[styles.addButton, { opacity: addingSkill ? 0.5 : 1 }]}
              >
                <Plus size={18} color="#ffffff" />
              </Pressable>
            </XStack>
          </YStack>

          {localSkills.length > 0 && (
            <YStack gap={8}>
              <Text fontSize={13} fontWeight="500" color="#6b7280">{t('skillsAdded')}</Text>
              {localSkills.map((skill) => (
                <SkillItemRow
                  key={skill.id}
                  skill={skill}
                  onReload={onReloadSkill}
                  onRemove={onRemoveSkill}
                />
              ))}
            </YStack>
          )}
        </>
      )}
    </YStack>
  );
}

const styles = StyleSheet.create({
  skillInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
