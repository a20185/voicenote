import * as FileSystem from 'expo-file-system/legacy';
import i18n from 'i18next';
import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';

export interface UploadProgress {
  loaded: number;
  total: number;
  progress: number;
}

export interface UploadResult {
  id: string;
  url: string;
  mimeType: string;
  size: number;
}

class FileUploader {
  private uploadDir = `${FileSystem.documentDirectory ?? ''}uploads/`;

  async ensureUploadDir() {
    const dirInfo = await FileSystem.getInfoAsync(this.uploadDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.uploadDir, { intermediates: true });
    }
  }

  async uploadFile(
    uri: string,
    type: 'recording' | 'media',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    await this.ensureUploadDir();

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error(i18n.t('errors:fileNotExist'));
    }

    // Read file as base64 for upload
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    const fileName = uri.split('/').pop() || 'file';
    const mimeType = this.getMimeType(fileName);

    // Upload to server
    const endpoint = type === 'recording'
      ? API_ENDPOINTS.recordings.upload
      : API_ENDPOINTS.media.upload;

    const response = await apiClient.post<UploadResult>(endpoint, {
      file: base64,
      fileName,
      mimeType,
    });

    if (onProgress) {
      onProgress({ loaded: 100, total: 100, progress: 1 });
    }

    return response.data;
  }

  async uploadMultiple(
    files: Array<{ uri: string; type: 'recording' | 'media' }>,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const result = await this.uploadFile(
        files[i].uri,
        files[i].type,
        onProgress ? (p) => onProgress(i, p) : undefined
      );
      results.push(result);
    }

    return results;
  }

  private getMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      // Audio
      mp3: 'audio/mpeg',
      m4a: 'audio/mp4',
      wav: 'audio/wav',
      aac: 'audio/aac',
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      // Video
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  async getLocalFileSize(uri: string): Promise<number> {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists && 'size' in fileInfo) {
      return fileInfo.size;
    }
    return 0;
  }

  async deleteLocalFile(uri: string): Promise<void> {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(uri);
    }
  }
}

export const fileUploader = new FileUploader();
