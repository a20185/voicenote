import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { X, Check, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  useCategories,
  useCreateCategory,
  useAssignNotesToCategory,
} from '@/hooks/useCategories';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.7;

const PREDEFINED_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
];

interface CategoryAssignmentOverlayProps {
  visible: boolean;
  noteIds: number[];
  onClose: () => void;
  onAssigned: () => void;
}

export function CategoryAssignmentOverlay({
  visible,
  noteIds,
  onClose,
  onAssigned,
}: CategoryAssignmentOverlayProps) {
  const { t } = useTranslation('category');
  const [mounted, setMounted] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());
  const [newName, setNewName] = useState('');

  const translateY = useSharedValue(SCREEN_HEIGHT);

  const { data: categories = [] } = useCategories();
  const createMutation = useCreateCategory();
  const assignMutation = useAssignNotesToCategory();

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setSelectedCategoryIds(new Set());
      setNewName('');
      requestAnimationFrame(() => {
        translateY.value = withSpring(0, { damping: 30, stiffness: 300, overshootClamping: true });
      });
    } else if (mounted) {
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const toggleCategory = useCallback((id: number) => {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleAdd = useCallback(() => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const color = PREDEFINED_COLORS[categories.length % PREDEFINED_COLORS.length];
    createMutation.mutate({ name: trimmed, color, order: categories.length, createdAt: new Date() });
    setNewName('');
  }, [newName, categories.length, createMutation]);

  const handleConfirm = useCallback(async () => {
    const categoryIds = Array.from(selectedCategoryIds);
    for (const categoryId of categoryIds) {
      await assignMutation.mutateAsync({ categoryId, noteIds });
    }
    onAssigned();
  }, [selectedCategoryIds, noteIds, assignMutation, onAssigned]);

  if (!mounted) return null;

  return (
    <Modal transparent visible={mounted} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View />
      </Pressable>
      <Animated.View style={[styles.sheet, animatedStyle]}>
        {/* Drag handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handleBar} />
        </View>

        {/* Title bar */}
        <View style={styles.titleBar}>
          <Text style={styles.title}>{t('assignTitle')}</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={20} color="#71717a" />
          </Pressable>
        </View>

        {/* Selected count */}
        <View style={styles.countBar}>
          <Text style={styles.countText}>
            {t('assigningCount', { count: noteIds.length })}
          </Text>
        </View>

        {/* Category list */}
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          {categories.map((cat) => {
            const isSelected = selectedCategoryIds.has(cat.id);
            return (
              <Pressable
                key={cat.id}
                style={[styles.catRow, isSelected && styles.catRowSelected]}
                onPress={() => toggleCategory(cat.id)}
              >
                <View style={[styles.colorDot, { backgroundColor: cat.color ?? undefined }]} />
                <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                <View style={{ flex: 1 }} />
                {isSelected && <Check size={20} color="#22c55e" />}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* New category input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.newInput}
            value={newName}
            onChangeText={setNewName}
            placeholder={t('newCategoryPlaceholder')}
            placeholderTextColor="#a1a1aa"
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <Pressable
            onPress={handleAdd}
            style={[styles.addButton, newName.trim() ? styles.addButtonEnabled : styles.addButtonDisabled]}
            disabled={!newName.trim()}
          >
            <Plus size={20} color={newName.trim() ? '#ffffff' : '#a1a1aa'} />
          </Pressable>
        </View>

        {/* Confirm button */}
        <View style={styles.confirmContainer}>
          <Pressable
            onPress={handleConfirm}
            style={[styles.confirmButton, selectedCategoryIds.size === 0 && styles.confirmButtonDisabled]}
            disabled={selectedCategoryIds.size === 0}
          >
            <Text style={styles.confirmText}>{t('assignConfirm')}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SHEET_MAX_HEIGHT,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d4d4d8',
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e4e4e7',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#18181b',
  },
  closeButton: {
    padding: 8,
    borderRadius: 9999,
  },
  countBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fafafa',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e4e4e7',
  },
  countText: {
    fontSize: 14,
    color: '#71717a',
  },
  list: {
    flex: 1,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#fafafa',
    gap: 12,
  },
  catRowSelected: {
    backgroundColor: '#fafafa',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  catName: {
    fontSize: 15,
    color: '#18181b',
    flexShrink: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e4e4e7',
    gap: 8,
  },
  newInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    fontSize: 14,
    color: '#18181b',
  },
  addButton: {
    padding: 12,
    borderRadius: 12,
  },
  addButtonEnabled: {
    backgroundColor: '#18181b',
  },
  addButtonDisabled: {
    backgroundColor: '#f4f4f5',
  },
  confirmContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  confirmButton: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#18181b',
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 15,
  },
});
