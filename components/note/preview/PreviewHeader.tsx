import React, { useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { Text } from 'tamagui';
import { X, Check, Mic } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface PreviewHeaderProps {
  saveStatus: SaveStatus;
  isDirty: boolean;
  isRecording?: boolean;
  isTranscribing?: boolean;
  onClose: () => void;
  onSave: () => void;
  onToggleRecording?: () => void;
}

function PulsingDot() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.pulsingDot, { opacity }]} />
  );
}

export function PreviewHeader({
  saveStatus,
  isDirty,
  isRecording = false,
  isTranscribing = false,
  onClose,
  onSave,
  onToggleRecording,
}: PreviewHeaderProps) {
  const { t } = useTranslation(['recording', 'common']);
  return (
    <View style={styles.container}>
      {/* Close button (left) */}
      <Pressable
        onPress={onClose}
        style={({ pressed }) => [styles.closeButton, pressed && styles.buttonPressed]}
      >
        <X size={20} color="#6b7280" />
      </Pressable>

      {/* Status indicator (center) */}
      <View style={styles.statusContainer}>
        {isRecording ? (
          <View style={styles.statusRow}>
            <PulsingDot />
            <Text fontSize={11} color="#ef4444">{t('recording:recording')}</Text>
          </View>
        ) : isTranscribing ? (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color="#6366f1" style={{ marginRight: 4 }} />
            <Text fontSize={11} color="#6366f1">{t('recording:transcribing')}</Text>
          </View>
        ) : saveStatus === 'saving' ? (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color="#9ca3af" style={{ marginRight: 4 }} />
            <Text fontSize={11} color="#9ca3af">{t('common:saving')}</Text>
          </View>
        ) : saveStatus === 'saved' ? (
          <Text fontSize={11} color="#9ca3af">{t('common:saved')}</Text>
        ) : saveStatus === 'error' ? (
          <Text fontSize={11} color="#ef4444">{t('common:saveFailed')}</Text>
        ) : null}
      </View>

      {/* Right buttons */}
      <View style={styles.rightButtons}>
        {/* Mic button */}
        {onToggleRecording && (
          <Pressable
            onPress={onToggleRecording}
            style={[
              styles.micButton,
              isRecording && styles.micButtonRecording,
            ]}
          >
            <Mic size={18} color={isRecording ? '#fff' : '#4b5563'} />
          </Pressable>
        )}

        {/* Save button */}
        <Pressable
          onPress={onSave}
          style={[styles.saveButton, isDirty ? styles.saveButtonActive : styles.saveButtonInactive]}
        >
          <Check size={20} color={isDirty ? '#fff' : '#9ca3af'} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 8,
  },
  buttonPressed: {
    backgroundColor: '#f3f4f6',
  },
  statusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  micButton: {
    padding: 8,
    borderRadius: 8,
  },
  micButtonRecording: {
    backgroundColor: '#ef4444',
  },
  saveButton: {
    padding: 8,
    marginRight: -8,
    borderRadius: 8,
  },
  saveButtonActive: {
    backgroundColor: '#18181b',
  },
  saveButtonInactive: {
    backgroundColor: '#f3f4f6',
  },
});
