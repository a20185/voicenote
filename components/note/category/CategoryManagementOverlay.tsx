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
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { X, GripVertical, Edit2, Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { Category } from '@/db';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
} from '@/hooks/useCategories';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.7;

const PREDEFINED_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
];

interface CategoryManagementOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export function CategoryManagementOverlay({ visible, onClose }: CategoryManagementOverlayProps) {
  const { t } = useTranslation('category');
  const [mounted, setMounted] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const translateY = useSharedValue(SCREEN_HEIGHT);

  const { data: categories = [] } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const reorderMutation = useReorderCategories();

  useEffect(() => {
    if (visible) {
      setMounted(true);
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

  useEffect(() => {
    if (!mounted) {
      setNewName('');
      setEditingId(null);
    }
  }, [mounted]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleAdd = useCallback(() => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const color = PREDEFINED_COLORS[categories.length % PREDEFINED_COLORS.length];
    createMutation.mutate({ name: trimmed, color, order: categories.length, createdAt: new Date() });
    setNewName('');
  }, [newName, categories.length, createMutation]);

  const handleStartEdit = useCallback((cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingId == null) return;
    const trimmed = editingName.trim();
    if (trimmed) {
      updateMutation.mutate({ id: editingId, data: { name: trimmed } });
    }
    setEditingId(null);
  }, [editingId, editingName, updateMutation]);

  const handleDelete = useCallback((cat: Category) => {
    Alert.alert(
      t('deleteConfirmTitle'),
      t('deleteConfirmMessage', { name: cat.name }),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => deleteMutation.mutate(cat.id) },
      ],
    );
  }, [t, deleteMutation]);

  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0) return;
    const ids = categories.map((c) => c.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    reorderMutation.mutate(ids);
  }, [categories, reorderMutation]);

  const handleMoveDown = useCallback((index: number) => {
    if (index >= categories.length - 1) return;
    const ids = categories.map((c) => c.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    reorderMutation.mutate(ids);
  }, [categories, reorderMutation]);

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
          <Text style={styles.title}>{t('manage')}</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={20} color="#71717a" />
          </Pressable>
        </View>

        {/* Category list */}
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          {categories.map((cat, index) => (
            <View key={cat.id} style={styles.row}>
              <View style={styles.reorderButtons}>
                <Pressable onPress={() => handleMoveUp(index)} hitSlop={8}>
                  <ChevronUp size={14} color={index === 0 ? '#e4e4e7' : '#a1a1aa'} />
                </Pressable>
                <Pressable onPress={() => handleMoveDown(index)} hitSlop={8}>
                  <ChevronDown size={14} color={index === categories.length - 1 ? '#e4e4e7' : '#a1a1aa'} />
                </Pressable>
              </View>
              <GripVertical size={16} color="#d4d4d8" />
              <View style={[styles.colorDot, { backgroundColor: cat.color ?? undefined }]} />
              {editingId === cat.id ? (
                <TextInput
                  style={styles.editInput}
                  value={editingName}
                  onChangeText={setEditingName}
                  onBlur={handleSaveEdit}
                  onSubmitEditing={handleSaveEdit}
                  autoFocus
                />
              ) : (
                <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
              )}
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => handleStartEdit(cat)} hitSlop={8} style={styles.iconBtn}>
                <Edit2 size={16} color="#a1a1aa" />
              </Pressable>
              <Pressable
                onPress={() => handleDelete(cat)}
                hitSlop={8}
                style={styles.iconBtn}
              >
                {({ pressed }) => (
                  <Trash2 size={16} color={pressed ? '#ef4444' : '#a1a1aa'} />
                )}
              </Pressable>
            </View>
          ))}
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
  list: {
    flex: 1,
  },
  row: {
    height: 48,
    paddingHorizontal: 16,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reorderButtons: {
    alignItems: 'center',
    gap: 2,
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
  editInput: {
    backgroundColor: '#f4f4f5',
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 15,
    flex: 1,
    height: 32,
  },
  iconBtn: {
    padding: 4,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e4e4e7',
    flexDirection: 'row',
    gap: 8,
  },
  newInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    fontSize: 14,
  },
  addButton: {
    padding: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonEnabled: {
    backgroundColor: '#18181b',
  },
  addButtonDisabled: {
    backgroundColor: '#f4f4f5',
  },
});
