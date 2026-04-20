import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from 'tamagui';
import { FileText, FileSpreadsheet, File as FileIcon, Music } from 'lucide-react-native';

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: '#E53935',
  xlsx: '#43A047', xls: '#43A047', csv: '#43A047',
  doc: '#1E88E5', docx: '#1E88E5',
  mp3: '#8E24AA', m4a: '#8E24AA', wav: '#8E24AA', aac: '#8E24AA',
};

function getFileColor(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return FILE_TYPE_COLORS[ext] || '#757575';
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf' || ext === 'doc' || ext === 'docx') return FileText;
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return FileSpreadsheet;
  if (['mp3', 'm4a', 'wav', 'aac'].includes(ext)) return Music;
  return FileIcon;
}

interface DocumentThumbnailProps {
  fileName: string;
  onPress: () => void;
}

export function DocumentThumbnail({ fileName, onPress }: DocumentThumbnailProps) {
  const color = getFileColor(fileName);
  const Icon = getFileIcon(fileName);
  const ext = fileName.split('.').pop()?.toUpperCase() || '';

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: color + '33' }]}>
        <Icon size={24} color={color} />
      </View>
      {ext ? <Text style={styles.ext}>{ext}</Text> : null}
      <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 80, height: 80, borderRadius: 8,
    backgroundColor: '#f9fafb',
    alignItems: 'center', justifyContent: 'center', padding: 4,
  },
  iconContainer: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  ext: { fontSize: 10, fontWeight: '500', textTransform: 'uppercase', color: '#6b7280', marginTop: 2 },
  fileName: { fontSize: 11, color: '#6b7280', width: '100%', textAlign: 'center' },
});
