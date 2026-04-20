import { useState, useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Alert, Dimensions } from 'react-native';
import { YStack, XStack, Text, styled, Theme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react-native';
import {
  useSettingsStore,
  defaultASRConfig,
  defaultAIConfig,
  defaultSkillsConfig,
  defaultOptimizationConfig,
} from '@/store/useSettingsStore';
import { SettingsContent } from './SettingsContent';
import type { ASRConfig, AIConfig, Skill, OptimizationLevel } from '@/types/settings';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface SettingsOverlayProps {
  visible: boolean;
  onClose: () => void;
}

const OverlayContainer = styled(YStack, {
  flex: 1,
  justifyContent: 'flex-end',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
});

export function SettingsOverlay({ visible, onClose }: SettingsOverlayProps) {
  const { t } = useTranslation(['settings', 'common']);
  const store = useSettingsStore();

  // Local state for ASR/AI/Skills (explicit save pattern)
  const [localASR, setLocalASR] = useState<ASRConfig>({ ...store.asrConfig });
  const [localAI, setLocalAI] = useState<AIConfig>({ ...store.aiConfig, provider: store.aiConfig.provider || 'cloud' });
  const [localSkillsEnabled, setLocalSkillsEnabled] = useState(store.skillsConfig.enabled);
  const [localSkills, setLocalSkills] = useState<Skill[]>([...store.skillsConfig.skills]);
  const [localOptimizationEnabled, setLocalOptimizationEnabled] = useState(store.optimizationConfig.enabled);
  const [localOptimizationLevel, setLocalOptimizationLevel] = useState<OptimizationLevel>(store.optimizationConfig.level);

  // Reset local state when overlay opens
  useEffect(() => {
    if (visible) {
      setLocalASR({ ...store.asrConfig });
      setLocalAI({ ...store.aiConfig, provider: store.aiConfig.provider || 'cloud' });
      setLocalSkillsEnabled(store.skillsConfig.enabled);
      setLocalSkills([...store.skillsConfig.skills]);
      setLocalOptimizationEnabled(store.optimizationConfig.enabled);
      setLocalOptimizationLevel(store.optimizationConfig.level);
    }
  }, [visible, store.asrConfig, store.aiConfig, store.skillsConfig, store.optimizationConfig]);

  const handleRestoreDefaults = () => {
    setLocalASR({ ...defaultASRConfig });
    setLocalAI({ ...defaultAIConfig });
    setLocalSkillsEnabled(defaultSkillsConfig.enabled);
    setLocalSkills([...defaultSkillsConfig.skills]);
    setLocalOptimizationEnabled(defaultOptimizationConfig.enabled);
    setLocalOptimizationLevel(defaultOptimizationConfig.level);
  };

  const handleSave = () => {
    store.setASRConfig(localASR);
    store.setAIConfig({
      ...localAI,
      provider: localAI.provider || 'cloud',
    });
    store.setSkillsEnabled(localSkillsEnabled);
    store.setOptimizationEnabled(localOptimizationEnabled);
    store.setOptimizationLevel(localOptimizationLevel);
    // Sync skills: clear and re-add
    const currentSkills = useSettingsStore.getState().skillsConfig.skills;
    currentSkills.forEach((s) => store.removeSkill(s.id));
    localSkills.forEach((s) => store.addSkill(s));
    Alert.alert(t('settings:saveSuccess'));
    onClose();
  };

  const handleModalClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleModalClose}
    >
      <Theme name="light">
        <OverlayContainer>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleModalClose} />

          <YStack style={styles.bottomSheet}>
            {/* Handle */}
            <YStack style={styles.handle} />

            {/* Header */}
            <XStack
              justifyContent="space-between"
              alignItems="center"
              paddingBottom={16}
            >
              <Text fontSize={20} fontWeight="600" color="#111827">
                {t('settings:title')}
              </Text>
            </XStack>

            {/* Content - ScrollView wrapper */}
            <YStack flex={1}>
              <SettingsContent
                localASR={localASR}
                setLocalASR={setLocalASR}
                localAI={localAI}
                setLocalAI={setLocalAI}
                localSkillsEnabled={localSkillsEnabled}
                setLocalSkillsEnabled={setLocalSkillsEnabled}
                localSkills={localSkills}
                setLocalSkills={setLocalSkills}
                localOptimizationEnabled={localOptimizationEnabled}
                setLocalOptimizationEnabled={setLocalOptimizationEnabled}
                localOptimizationLevel={localOptimizationLevel}
                setLocalOptimizationLevel={setLocalOptimizationLevel}
                onClose={onClose}
              />
            </YStack>

            {/* Footer - Save/Restore Buttons */}
            <XStack
              paddingTop={12}
              paddingBottom={24}
              gap={12}
              borderTopWidth={StyleSheet.hairlineWidth}
              borderTopColor="#e4e4e7"
            >
              <Pressable
                onPress={handleRestoreDefaults}
                style={[styles.bottomButton, { backgroundColor: '#f3f4f6' }]}
              >
                <RefreshCw size={16} color="#374151" />
                <Text fontSize={14} fontWeight="500" color="#374151">{t('restoreDefaults')}</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={[styles.bottomButton, { backgroundColor: '#111827' }]}>
                <Text fontSize={14} fontWeight="600" color="#ffffff">{t('common:save')}</Text>
              </Pressable>
            </XStack>
          </YStack>
        </OverlayContainer>
      </Theme>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
    height: Math.min(SCREEN_HEIGHT * 0.85, 800),
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  bottomButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
