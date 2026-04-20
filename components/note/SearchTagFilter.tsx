import React, { useRef, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, LayoutChangeEvent, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface SearchTagFilterProps {
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
}

export function SearchTagFilter({ tags, selectedTags, onToggleTag, onClearTags }: SearchTagFilterProps) {
  const { t } = useTranslation('search');
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    setShowLeftShadow(contentOffset.x > 4);
    setShowRightShadow(contentOffset.x < contentSize.width - layoutMeasurement.width - 4);
  }, []);

  const handleContentSizeChange = useCallback((w: number) => {
    // Initial overflow check handled by onLayout
    setShowRightShadow(w > 0);
  }, []);

  if (tags.length === 0) return null;

  return (
    <View style={styles.container}>
      {showLeftShadow && (
        <LinearGradient
          colors={['#ffffff', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.leftShadow}
          pointerEvents="none"
        />
      )}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={16}
      >
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <Pressable
              key={tag}
              style={[styles.tagButton, isSelected && styles.tagButtonSelected]}
              onPress={() => onToggleTag(tag)}
            >
              <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                {tag}
              </Text>
              {isSelected && <X size={12} color="#ffffff" />}
            </Pressable>
          );
        })}
        {selectedTags.length > 0 && (
          <Pressable style={styles.clearButton} onPress={onClearTags}>
            <Text style={styles.clearText}>{t('search:clear')}</Text>
          </Pressable>
        )}
      </ScrollView>
      {showRightShadow && (
        <LinearGradient
          colors={['transparent', '#ffffff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rightShadow}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    position: 'relative',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leftShadow: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 24,
    zIndex: 10,
  },
  rightShadow: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 24,
    zIndex: 10,
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  tagButtonSelected: {
    backgroundColor: '#111827',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4b5563',
  },
  tagTextSelected: {
    color: '#ffffff',
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clearText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
  },
});
