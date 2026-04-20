import React, { useState } from 'react';
import { Modal, View, Pressable, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from 'tamagui';
import {
  Sparkles,
  X,
  FileText,
  Tag,
  Lightbulb,
  CheckSquare,
  Bookmark,
  Check,
  Link,
  ChevronRight,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { EnhancedAIAnalysisResult, AISourceNote } from '@/types/ai';
import { CollapsibleInsight } from './CollapsibleInsight';
import { CollapsibleActionItem } from './CollapsibleActionItem';

export type AIAnalysisState = 'analyzing' | 'success' | 'error';

export interface AIAnalysisOverlayProps {
  visible: boolean;
  state: AIAnalysisState;
  result: EnhancedAIAnalysisResult | null;
  error: string | null;
  sourceNoteCount: number;
  sourceNotes: AISourceNote[];
  onRetry: () => void;
  onSave: () => void;
  onClose: () => void;
  onSourceNotePress: (noteId: number) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function PulsingCircle() {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withRepeat(withTiming(1.2, { duration: 1500 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.pulseCircle, animatedStyle]}>
      <Sparkles size={32} color="#a855f7" />
    </Animated.View>
  );
}

function AnalyzingContent() {
  const { t } = useTranslation('ai');
  return (
    <View style={styles.centeredContainer}>
      <PulsingCircle />
      <Text fontSize={16} fontWeight="500" color="#111827" marginTop={20}>
        {t('analyzing')}
      </Text>
      <Text fontSize={14} color="#6b7280" marginTop={8}>
        {t('understandingContent')}
      </Text>
      <View style={styles.progressBarOuter}>
        <View style={styles.progressBarInner} />
      </View>
    </View>
  );
}

function ErrorContent({ error, onRetry, onClose }: { error: string | null; onRetry: () => void; onClose: () => void }) {
  const { t } = useTranslation(['ai', 'common']);
  return (
    <View style={styles.centeredContainer}>
      <View style={styles.errorCircle}>
        <X size={32} color="#ef4444" />
      </View>
      <Text fontSize={16} fontWeight="500" color="#111827" marginTop={20}>
        {t('ai:analysisFailed')}
      </Text>
      <Text fontSize={14} color="#6b7280" marginTop={8} textAlign="center" paddingHorizontal={20}>
        {error || t('ai:unknownError')}
      </Text>
      <View style={styles.errorButtons}>
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text fontSize={14} fontWeight="600" color="#a855f7">{t('common:retry')}</Text>
        </Pressable>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text fontSize={14} fontWeight="600" color="#6b7280">{t('common:close')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.sectionHeader}>
      {icon}
      <Text fontSize={13} fontWeight="500" color="#6b7280">{label}</Text>
    </View>
  );
}

function SuccessContent({
  result,
  sourceNotes,
  onSave,
  onSourceNotePress,
}: {
  result: EnhancedAIAnalysisResult;
  sourceNotes: AISourceNote[];
  onSave: () => void;
  onSourceNotePress: (noteId: number) => void;
}) {
  const { t } = useTranslation(['ai', 'common']);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
      setSaved(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Summary */}
      <View style={styles.section}>
        <SectionHeader icon={<FileText size={15} color="#6b7280" />} label={t('ai:summary')} />
        <View style={styles.contentBox}>
          <Text fontSize={14} color="#374151" lineHeight={22}>{result.summary}</Text>
        </View>
      </View>

      {/* Tags */}
      {result.tags.length > 0 && (
        <View style={styles.section}>
          <SectionHeader icon={<Tag size={15} color="#6b7280" />} label={t('ai:tags')} />
          <View style={styles.tagsContainer}>
            {result.tags.map((tag, i) => (
              <View key={i} style={[styles.tagPill, tag.relevance > 0.8 && styles.tagHighRelevance]}>
                <Text fontSize={12} fontWeight="600" color="#7c3aed">{tag.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Key Insights */}
      {result.keyInsights.length > 0 && (
        <View style={styles.section}>
          <SectionHeader icon={<Lightbulb size={15} color="#6b7280" />} label={t('ai:keyInsights')} />
          <View style={styles.contentBox}>
            {result.keyInsights.map((insight, i) => (
              <CollapsibleInsight key={i} insight={insight} />
            ))}
          </View>
        </View>
      )}

      {/* Action Items */}
      {result.actionItems.length > 0 && (
        <View style={styles.section}>
          <SectionHeader icon={<CheckSquare size={15} color="#6b7280" />} label={t('ai:actionItems')} />
          <View style={styles.contentBox}>
            {result.actionItems.map((action, i) => (
              <CollapsibleActionItem key={i} action={action} />
            ))}
          </View>
        </View>
      )}

      {/* Source Notes */}
      {sourceNotes.length > 0 && (
        <View style={styles.sourceSection}>
          <SectionHeader icon={<Link size={15} color="#6b7280" />} label={t('ai:sourceNotes', { count: sourceNotes.length })} />
          {sourceNotes.map((note) => (
            <Pressable
              key={note.id}
              style={({ pressed }) => [styles.sourceNoteRow, pressed && styles.sourceNotePressed]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSourceNotePress(note.id);
              }}
            >
              <FileText size={16} color="#a855f7" />
              <View style={styles.sourceNoteText}>
                <Text fontSize={14} fontWeight="500" color="#111827" numberOfLines={1}>{note.title}</Text>
                {note.preview ? (
                  <Text fontSize={12} color="#9ca3af" numberOfLines={1}>{note.preview}</Text>
                ) : null}
              </View>
              <ChevronRight size={16} color="#d1d5db" />
            </Pressable>
          ))}
        </View>
      )}

      {/* Save Button */}
      <View style={styles.saveButtonWrapper}>
        <Pressable
          style={[styles.saveButton, saved && styles.saveButtonSaved]}
          onPress={handleSave}
          disabled={saving || saved}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : saved ? (
            <>
              <Check size={18} color="#ffffff" />
              <Text fontSize={15} fontWeight="600" color="#ffffff">{t('common:saved')}</Text>
            </>
          ) : (
            <>
              <Bookmark size={18} color="#ffffff" />
              <Text fontSize={15} fontWeight="600" color="#ffffff">{t('ai:saveToInspirations')}</Text>
            </>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

export function AIAnalysisOverlay({
  visible,
  state,
  result,
  error,
  sourceNoteCount,
  sourceNotes,
  onRetry,
  onSave,
  onClose,
  onSourceNotePress,
}: AIAnalysisOverlayProps) {
  const { t } = useTranslation('ai');
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.container}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Sparkles size={20} color="#a855f7" />
            <Text fontSize={17} fontWeight="600" color="#111827" flex={1} marginLeft={8}>
              {t('aiAnalysis')}
            </Text>
            {state === 'success' && (
              <Text fontSize={12} color="#9ca3af" marginRight={8}>
                {t('basedOnNotes', { count: sourceNoteCount })}
              </Text>
            )}
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#9ca3af" />
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.body}>
            {state === 'analyzing' && <AnalyzingContent />}
            {state === 'error' && <ErrorContent error={error} onRetry={onRetry} onClose={onClose} />}
            {state === 'success' && result && (
              <SuccessContent
                result={result}
                sourceNotes={sourceNotes}
                onSave={onSave}
                onSourceNotePress={onSourceNotePress}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    height: Math.min(SCREEN_HEIGHT * 0.7, 650),
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#faf5ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarOuter: {
    width: 120,
    height: 3,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressBarInner: {
    width: '60%',
    height: '100%',
    backgroundColor: '#a855f7',
    borderRadius: 2,
  },
  errorCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#faf5ff',
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  contentBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    backgroundColor: '#faf5ff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagHighRelevance: {
    backgroundColor: '#f3e8ff',
  },
  sourceSection: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
    marginBottom: 20,
  },
  sourceNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    marginBottom: 8,
  },
  sourceNotePressed: {
    backgroundColor: '#f3f4f6',
  },
  sourceNoteText: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  saveButtonWrapper: {
    marginTop: 8,
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonSaved: {
    backgroundColor: '#22c55e',
  },
});
