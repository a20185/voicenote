import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Pressable,
  Text as RNText,
  Dimensions,
} from 'react-native';
import { CameraView as ExpoCameraView } from 'expo-camera';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { RotateCcw, X, Image as ImageIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useCamera } from '@hooks';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface CameraOverlayProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    type: 'photo' | 'video';
    uri: string;
    thumbnailUri?: string;
    note?: string;
  }) => void;
}

interface CaptureItem {
  uri: string;
  type: 'photo' | 'video';
}

export function CameraOverlay({ visible, onClose, onSave }: CameraOverlayProps) {
  const { t } = useTranslation(['camera', 'common']);
  const {
    setCameraRef,
    isRecording,
    facing,
    toggleFacing,
    takePicture,
    startRecording,
    stopRecording,
    isReady,
    setIsReady,
    hasPermission,
    requestPermissions,
  } = useCamera();

  const [captures, setCaptures] = useState<CaptureItem[]>([]);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [mountError, setMountError] = useState<string | null>(null);

  // Long-press detection refs
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stable camera ref callback
  const cameraRefCallback = useCallback(
    (ref: ExpoCameraView | null) => { setCameraRef(ref); },
    [setCameraRef],
  );

  // Flash animation
  const flashOpacity = useSharedValue(0);
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  // Slide animation
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Mount/unmount with animation
  useEffect(() => {
    if (visible) {
      setMounted(true);
      setMountError(null);
      // Animate in on next frame
      requestAnimationFrame(() => {
        translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
      });
    } else if (mounted) {
      // Animate out, then unmount
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  // Recording dot pulse animation
  const dotOpacity = useSharedValue(1);
  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  // Auto-request permissions when overlay opens
  useEffect(() => {
    if (visible && !hasPermission) {
      requestPermissions();
    }
  }, [visible, hasPermission, requestPermissions]);

  // isReady fallback: force ready after 3s
  useEffect(() => {
    if (!visible || isReady) return;
    const timeout = setTimeout(() => setIsReady(true), 3000);
    return () => clearTimeout(timeout);
  }, [visible, isReady, setIsReady]);

  // Start pulse when recording
  useEffect(() => {
    if (isRecording) {
      dotOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      dotOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [isRecording, dotOpacity]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingSeconds(0);
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  // Reset state when overlay opens
  useEffect(() => {
    if (visible) {
      setCaptures([]);
      setRecordingSeconds(0);
      setIsReady(false);
    }
  }, [visible, setIsReady]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const triggerFlash = useCallback(() => {
    flashOpacity.value = 0.8;
    flashOpacity.value = withTiming(0, { duration: 300 });
  }, [flashOpacity]);

  const handleClose = useCallback(() => {
    if (isRecording) return; // prevent closing while recording
    onClose();
  }, [isRecording, onClose]);

  const handlePressIn = useCallback(() => {
    isLongPressRef.current = false;
    pressTimerRef.current = setTimeout(async () => {
      isLongPressRef.current = true;
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      startRecording();
    }, 500);
  }, [startRecording]);

  const handlePressOut = useCallback(async () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    if (isLongPressRef.current && isRecording) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await stopRecording();
      if (result) {
        setCaptures((prev) => [...prev, { uri: result.uri, type: 'video' }]);
      }
    } else if (!isLongPressRef.current) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      triggerFlash();
      const result = await takePicture();
      if (result) {
        setCaptures((prev) => [...prev, { uri: result.uri, type: 'photo' }]);
      }
    }
  }, [isRecording, stopRecording, takePicture, triggerFlash]);

  const handleSave = useCallback(() => {
    if (captures.length === 0) return;
    const primary = captures[0];
    onSave({
      type: primary.type === 'video' ? 'video' : 'photo',
      uri: primary.uri,
    });
  }, [captures, onSave]);

  // Header title
  const title = isRecording ? `${t('recordingVideo')} ${formatTime(recordingSeconds)}` : t('capture');

  if (!mounted) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlayContainer]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

      <Animated.View style={[styles.bottomSheet, sheetAnimatedStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <X size={24} color="#9ca3af" />
            </Pressable>

            <View style={styles.titleRow}>
              {isRecording && <Animated.View style={[styles.recordingDot, dotStyle]} />}
              <RNText style={styles.headerTitle}>{title}</RNText>
            </View>

            <Pressable
              style={[styles.saveButton, captures.length === 0 && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={captures.length === 0}
            >
              <RNText style={styles.saveButtonText}>
                {captures.length > 0 ? `${t('common:save')} (${captures.length})` : t('common:save')}
              </RNText>
            </Pressable>
          </View>

          {!hasPermission ? (
            /* Permission request inside bottom sheet */
            <View style={styles.permissionContainer}>
              <RNText style={styles.permissionText}>{t('permissionMessage')}</RNText>
              <Pressable style={styles.permissionButton} onPress={requestPermissions}>
                <RNText style={styles.permissionButtonText}>{t('allow')}</RNText>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Camera viewfinder */}
              <View style={styles.cameraWrapper}>
                <ExpoCameraView
                  ref={cameraRefCallback}
                  style={styles.camera}
                  facing={facing}
                  onCameraReady={() => setIsReady(true)}
                  onMountError={(e) => setMountError(e.message || t('loadFailed'))}
                />
                {/* Flash overlay */}
                <Animated.View style={[styles.flashOverlay, flashStyle]} pointerEvents="none" />
                {/* Recording badge */}
                {isRecording && (
                  <View style={styles.recordingBadge}>
                    <Animated.View style={[styles.recordingBadgeDot, dotStyle]} />
                    <RNText style={styles.recordingBadgeText}>{formatTime(recordingSeconds)}</RNText>
                  </View>
                )}
                {/* Mount error */}
                {mountError && (
                  <View style={styles.mountErrorOverlay}>
                    <RNText style={styles.mountErrorText}>{mountError}</RNText>
                  </View>
                )}
              </View>

              {/* Controls area */}
              <View style={styles.controlsArea}>
                <View style={styles.controlsRow}>
                  {/* Thumbnail preview */}
                  <View style={styles.thumbnailSlot}>
                    {captures.length > 0 ? (
                      <View>
                        <Image
                          source={{ uri: captures[captures.length - 1].uri }}
                          style={styles.thumbnail}
                        />
                        {captures.length > 1 && (
                          <View style={styles.countBadge}>
                            <RNText style={styles.countBadgeText}>{captures.length}</RNText>
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.thumbnailPlaceholder}>
                        <ImageIcon size={20} color="#6b7280" />
                      </View>
                    )}
                  </View>

                  {/* Shutter button */}
                  <Pressable
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={!isReady}
                  >
                    <View style={[styles.shutterOuter, isRecording && styles.shutterOuterRecording]}>
                      <View style={isRecording ? styles.shutterInnerRecording : styles.shutterInner} />
                    </View>
                  </Pressable>

                  {/* Flip camera button */}
                  <Pressable
                    style={styles.flipButton}
                    onPress={toggleFacing}
                    disabled={isRecording}
                  >
                    <RotateCcw size={20} color="#fff" />
                  </Pressable>
                </View>

                {/* Hint text */}
                {!isRecording && (
                  <RNText style={styles.hintText}>{t('tapPhotoLongVideo')}</RNText>
                )}
              </View>
            </>
          )}
        </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  bottomSheet: {
    height: '60%',
    backgroundColor: '#000',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fafafa',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fafafa',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  cameraWrapper: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#18181b',
  },
  camera: {
    flex: 1,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
  },
  recordingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239,68,68,0.8)',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  recordingBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  recordingBadgeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  controlsArea: {
    height: 96,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  thumbnailSlot: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  thumbnailPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  shutterOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#e5e7eb',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuterRecording: {
    borderColor: '#fecaca',
  },
  shutterInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#18181b',
  },
  shutterInnerRecording: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    fontSize: 10,
    color: '#d1d5db',
    textAlign: 'center',
    marginTop: 8,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  permissionText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
    backgroundColor: '#27272a',
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  mountErrorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  mountErrorText: {
    fontSize: 14,
    color: '#f87171',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});

export type CameraOverlayPropsType = CameraOverlayProps;
