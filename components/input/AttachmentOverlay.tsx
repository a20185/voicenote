import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  FlatList,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Check, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { OverlayHeader } from './OverlayHeader';
import { OverlayWrapper } from './OverlayWrapper';

// --- Types ---

interface AttachmentItem {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
  type: 'photo' | 'file';
  width?: number;
  height?: number;
}

export interface AttachmentOverlayProps {
  visible: boolean;
  onClose: () => void;
  onSave: (items: AttachmentItem[]) => void;
}

type TabType = 'photos' | 'files';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 8;
const GRID_PADDING = 20;
const NUM_COLUMNS = 3;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

// --- Helpers ---

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function getFileIcon(mimeType: string): string {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '🗜️';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.startsWith('text/')) return '📃';
  return '📎';
}

// --- Component ---

export function AttachmentOverlay({ visible, onClose, onSave }: AttachmentOverlayProps) {
  const { t } = useTranslation(['attachment', 'common']);
  const [activeTab, setActiveTab] = useState<TabType>('photos');
  const [photos, setPhotos] = useState<AttachmentItem[]>([]);
  const [files, setFiles] = useState<AttachmentItem[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<number>>(new Set());
  const [selectedFileIds, setSelectedFileIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (visible) {
      setActiveTab('photos');
      setPhotos([]);
      setFiles([]);
      setSelectedPhotoIds(new Set());
      setSelectedFileIds(new Set());
    }
  }, [visible]);

  const totalSelected = selectedPhotoIds.size + selectedFileIds.size;

  const handlePickPhotos = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;

    const startIndex = photos.length;
    const newPhotos: AttachmentItem[] = result.assets.map((asset, i) => ({
      uri: asset.uri,
      name: asset.fileName ?? `photo_${startIndex + i}.jpg`,
      mimeType: asset.mimeType ?? 'image/jpeg',
      size: asset.fileSize ?? 0,
      type: 'photo' as const,
      width: asset.width,
      height: asset.height,
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
    setSelectedPhotoIds(prev => {
      const next = new Set(prev);
      newPhotos.forEach((_, i) => next.add(startIndex + i));
      return next;
    });
  }, [photos.length]);

  const handlePickFiles = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (result.canceled || !result.assets?.length) return;

    const startIndex = files.length;
    const newFiles: AttachmentItem[] = result.assets.map((asset) => ({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/octet-stream',
      size: asset.size ?? 0,
      type: 'file' as const,
    }));
    setFiles(prev => [...prev, ...newFiles]);
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      newFiles.forEach((_, i) => next.add(startIndex + i));
      return next;
    });
  }, [files.length]);

  const togglePhoto = useCallback((index: number) => {
    setSelectedPhotoIds(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleFile = useCallback((index: number) => {
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    const selectedItems: AttachmentItem[] = [
      ...photos.filter((_, i) => selectedPhotoIds.has(i)),
      ...files.filter((_, i) => selectedFileIds.has(i)),
    ];
    if (selectedItems.length === 0) return;
    onSave(selectedItems);
  }, [photos, files, selectedPhotoIds, selectedFileIds, onSave]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const saveLabel = totalSelected > 0 ? `${t('common:add')} (${totalSelected})` : t('common:add');

  // --- Render photo grid item ---
  const renderPhotoItem = useCallback(({ item, index }: { item: AttachmentItem | 'add'; index: number }) => {
    if (item === 'add') {
      return (
        <Pressable style={s.photoAddButton} onPress={handlePickPhotos}>
          <Plus size={24} color="#9ca3af" />
          <Text style={s.photoAddText}>{t('selectPhotos')}</Text>
        </Pressable>
      );
    }
    const realIndex = index - 1;
    const isSelected = selectedPhotoIds.has(realIndex);
    return (
      <Pressable style={s.photoItem} onPress={() => togglePhoto(realIndex)}>
        <Image source={{ uri: item.uri }} style={s.photoImage} />
        {isSelected && (
          <View style={s.photoSelectedOverlay}>
            <View style={s.photoCheckCircle}>
              <Check size={14} color="#fff" strokeWidth={3} />
            </View>
          </View>
        )}
        {isSelected && <View style={s.photoSelectedBorder} />}
      </Pressable>
    );
  }, [selectedPhotoIds, handlePickPhotos, togglePhoto]);

  const photoGridData: (AttachmentItem | 'add')[] = ['add', ...photos];

  // --- Render JSX ---
  return (
    <OverlayWrapper visible={visible} onClose={handleCancel} height="60%">
      <OverlayHeader
        title={t('attachment')}
        onCancel={handleCancel}
        onSave={handleSave}
        saveDisabled={totalSelected === 0}
        saveLabel={saveLabel}
      />

      {/* Tab Switcher */}
      <View style={s.tabContainer}>
        <Pressable
          style={[s.tabButton, activeTab === 'photos' && s.tabButtonActive]}
          onPress={() => setActiveTab('photos')}
        >
          <Text style={[s.tabText, activeTab === 'photos' && s.tabTextActive]}>
            {t('photosAndVideos')}
          </Text>
        </Pressable>
        <Pressable
          style={[s.tabButton, activeTab === 'files' && s.tabButtonActive]}
          onPress={() => setActiveTab('files')}
        >
          <Text style={[s.tabText, activeTab === 'files' && s.tabTextActive]}>
            {t('files')}
          </Text>
        </Pressable>
      </View>

      {/* Tab Content */}
      {activeTab === 'photos' ? (
        <FlatList
          data={photoGridData}
          renderItem={renderPhotoItem}
          keyExtractor={(item, index) => (item === 'add' ? 'add' : `photo-${index}`)}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={s.gridRow}
          contentContainerStyle={s.gridContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ScrollView style={s.fileList} showsVerticalScrollIndicator={false}>
          {/* Browse button */}
          <Pressable style={s.fileBrowseButton} onPress={handlePickFiles}>
            <Plus size={20} color="#9ca3af" />
            <Text style={s.fileBrowseText}>{t('browseFiles')}</Text>
          </Pressable>

          {/* File items */}
          {files.map((file, index) => {
            const isSelected = selectedFileIds.has(index);
            return (
              <Pressable
                key={`file-${index}`}
                style={[s.fileItem, isSelected && s.fileItemSelected]}
                onPress={() => toggleFile(index)}
              >
                <View style={s.fileIconBox}>
                  <Text style={s.fileIconText}>{getFileIcon(file.mimeType)}</Text>
                </View>
                <View style={s.fileInfo}>
                  <Text style={s.fileName} numberOfLines={1}>{file.name}</Text>
                  <Text style={s.fileSize}>{formatFileSize(file.size)}</Text>
                </View>
                <View style={[s.fileCheckbox, isSelected && s.fileCheckboxSelected]}>
                  {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </OverlayWrapper>
  );
}

const s = StyleSheet.create({
  // Tab switcher
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#111827',
  },

  // Photo grid
  gridRow: {
    gap: GRID_GAP,
  },
  gridContent: {
    gap: GRID_GAP,
  },
  photoAddButton: {
    width: ITEM_SIZE,
    aspectRatio: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoAddText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  photoItem: {
    width: ITEM_SIZE,
    aspectRatio: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoSelectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSelectedBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: '#18181b',
    borderRadius: 12,
  },

  // File list
  fileList: {
    flex: 1,
  },
  fileBrowseButton: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  fileBrowseText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  fileItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  fileItemSelected: {
    borderColor: '#18181b',
    backgroundColor: '#fafafa',
  },
  fileIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIconText: {
    fontSize: 20,
  },
  fileInfo: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  fileSize: {
    fontSize: 12,
    color: '#9ca3af',
  },
  fileCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileCheckboxSelected: {
    backgroundColor: '#18181b',
    borderColor: '#18181b',
  },
});
