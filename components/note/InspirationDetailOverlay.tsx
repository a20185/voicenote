import React, { useState, useEffect } from 'react';
import { View, Pressable, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Text } from 'tamagui';
import {
  X,
  Trash2,
  FileText,
  Tag,
  Lightbulb,
  CheckSquare,
  Link,
  ChevronRight,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { Inspiration } from '@/db';
import type { EnhancedAIAnalysisResult, AISourceNote } from '@/types/ai';
import { CollapsibleInsight } from './CollapsibleInsight';
import { CollapsibleActionItem } from './CollapsibleActionItem';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_HEIGHT = Math.min(SCREEN_HEIGHT * 0.75, 700);
const CLOSE_THRESHOLD = 150;
const VELOCITY_THRESHOLD = 500;

interface InspirationDetailOverlayProps {
  visible: boolean;
  inspiration: Inspiration | null;
  onClose: () => void;
  onDelete: (id: number) => void;
  onSourceNotePress: (noteId: number) => void;
}

function parseJSON<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.sectionHeader}>
      {icon}
      <Text fontSize={13} fontWeight="500" color="#6b7280">{label}</Text>
    </View>
  );
}

export function InspirationDetailOverlay({
  visible,
  inspiration,
  onClose,
  onDelete,
  onSourceNotePress,
}: InspirationDetailOverlayProps) {
  const { t } = useTranslation(['inspiration', 'note', 'ai', 'common']);
  const [mounted, setMounted] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const startY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      requestAnimationFrame(() => {
        translateY.value = withSpring(0, { damping: 30, stiffness: 300, overshootClamping: true });
      });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250, easing: Easing.in(Easing.cubic) }, () => {
        runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const panGesture = Gesture.Pan()
    .onStart(() => { startY.value = translateY.value; })
    .onUpdate((e) => {
      const newY = startY.value + e.translationY;
      translateY.value = Math.max(0, newY);
    })
    .onEnd((e) => {
      if (translateY.value > CLOSE_THRESHOLD || e.velocityY > VELOCITY_THRESHOLD) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250, easing: Easing.in(Easing.cubic) }, () => {
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 30, stiffness: 300, overshootClamping: true });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!mounted || !inspiration) return null;

  const analysisData = parseJSON<EnhancedAIAnalysisResult | null>(inspiration.analysisData, null);
  const sourceNotes = parseJSON<AISourceNote[]>(inspiration.sourceNotes, []);

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.sheet, animatedStyle]}>
          <View style={styles.handleContainer}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text fontSize={17} fontWeight="600" color="#111827" flex={1} numberOfLines={1}>
              {inspiration.title}
            </Text>
            <Pressable
              onPress={() => { onDelete(inspiration.id); onClose(); }}
              style={styles.headerButton}
            >
              <Trash2 size={18} color="#ef4444" />
            </Pressable>
            <Pressable onPress={onClose} style={styles.headerButton}>
              <X size={20} color="#9ca3af" />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {analysisData && (
              <>
                {/* Summary */}
                <View style={styles.section}>
                  <SectionHeader icon={<FileText size={15} color="#6b7280" />} label={t('ai:summary')} />
                  <View style={styles.contentBox}>
                    <Text fontSize={14} color="#374151" lineHeight={22}>{analysisData.summary}</Text>
                  </View>
                </View>

                {/* Tags */}
                {analysisData.tags.length > 0 && (
                  <View style={styles.section}>
                    <SectionHeader icon={<Tag size={15} color="#6b7280" />} label={t('note:tags')} />
                    <View style={styles.tagsContainer}>
                      {analysisData.tags.map((tag, i) => (
                        <View key={i} style={[styles.tagPill, tag.relevance > 0.8 && styles.tagHighRelevance]}>
                          <Text fontSize={12} fontWeight="600" color="#7c3aed">{tag.name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Key Insights */}
                {analysisData.keyInsights.length > 0 && (
                  <View style={styles.section}>
                    <SectionHeader icon={<Lightbulb size={15} color="#6b7280" />} label={t('inspiration:insights')} />
                    <View style={styles.contentBox}>
                      {analysisData.keyInsights.map((insight, i) => (
                        <CollapsibleInsight key={i} insight={insight} />
                      ))}
                    </View>
                  </View>
                )}

                {/* Action Items */}
                {analysisData.actionItems.length > 0 && (
                  <View style={styles.section}>
                    <SectionHeader icon={<CheckSquare size={15} color="#6b7280" />} label={t('inspiration:actionItems')} />
                    <View style={styles.contentBox}>
                      {analysisData.actionItems.map((action, i) => (
                        <CollapsibleActionItem key={i} action={action} />
                      ))}
                    </View>
                  </View>
                )}
              </>
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

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.05)',
    zIndex: 50,
  },
  sheet: {
    height: PANEL_HEIGHT,
    backgroundColor: '#fff',
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
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
});
