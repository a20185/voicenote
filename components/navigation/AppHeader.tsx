import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from 'tamagui';
import { Search, LayoutGrid } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CapsuleTabs } from './CapsuleTabs';

export type ViewType = 'records' | 'inspiration';

export interface AppHeaderProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  onSearchPress?: () => void;
  onMorePress?: () => void;
}

export function AppHeader({
  activeView,
  onViewChange,
  onSearchPress,
  onMorePress,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('nav');

  const viewTabs: { key: ViewType; label: string }[] = [
    { key: 'records', label: t('records') },
    { key: 'inspiration', label: t('inspiration') },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 4 }]}>
      <View style={styles.row}>
        {/* Logo */}
        <Text fontSize={20} fontWeight="700" letterSpacing={-0.5} color="$text">
          Pieces
        </Text>

        {/* Capsule Tabs */}
        <CapsuleTabs
          tabs={viewTabs}
          activeKey={activeView}
          onChange={onViewChange}
        />

        {/* Action Icons */}
        <View style={styles.actions}>
          <Pressable style={styles.iconButton} onPress={onSearchPress}>
            <Search size={20} color="#6b7280" />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={onMorePress}>
            <LayoutGrid size={20} color="#6b7280" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
