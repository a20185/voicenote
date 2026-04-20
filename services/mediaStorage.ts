import { Paths, Directory, File } from 'expo-file-system';
import { db } from '@db/client';
import { mediaFiles } from '@db/schema';

const MEDIA_DIR = new Directory(Paths.document, 'media');

/**
 * Ensure media directory exists
 */
async function ensureMediaDirectory(): Promise<void> {
  if (!MEDIA_DIR.exists) {
    MEDIA_DIR.create();
  }
}

/**
 * Save a media file to local storage
 * @param sourceUri - Source URI of the file to copy
 * @param fileName - Name for the saved file
 * @returns Relative path to the saved file
 */
export async function saveMediaFile(
  sourceUri: string,
  fileName: string
): Promise<string> {
  await ensureMediaDirectory();

  const sourceFile = new File(sourceUri);
  const destinationFile = new File(MEDIA_DIR, fileName);

  // Copy file to media directory
  await sourceFile.copy(destinationFile);

  // Return relative path (just the filename)
  return fileName;
}

/**
 * Get full URI for a media file from its relative path
 * @param relativePath - Relative path (filename) of the media file
 * @returns Full URI to the media file
 */
export function getMediaUri(relativePath: string): string {
  const file = new File(MEDIA_DIR, relativePath);
  return file.uri;
}

/**
 * Delete a media file from storage
 * @param relativePath - Relative path (filename) of the media file to delete
 */
export async function deleteMediaFile(relativePath: string): Promise<void> {
  const file = new File(MEDIA_DIR, relativePath);

  if (file.exists) {
    await file.delete();
  }
}

/**
 * Get storage quota information
 * @returns Available and total storage in bytes
 */
export async function getStorageQuota(): Promise<{
  availableBytes: number;
  totalBytes: number;
}> {
  await ensureMediaDirectory();

  return {
    availableBytes: Paths.availableDiskSpace,
    totalBytes: Paths.totalDiskSpace,
  };
}

/**
 * Clean up media files that are not referenced in the database
 * @returns Number of files deleted
 */
export async function cleanupOrphanedMedia(): Promise<number> {
  await ensureMediaDirectory();

  // Get all media files from directory
  const dirContents = MEDIA_DIR.list();
  const dirFiles = dirContents.filter((item): item is File => item instanceof File);

  // Get all referenced files from database
  const dbMediaFiles = await db.select({ uri: mediaFiles.uri }).from(mediaFiles);

  // Extract filenames from URIs in database
  const referencedFiles = new Set<string>();
  dbMediaFiles.forEach((file: { uri: string }) => {
    const fileName = file.uri.split('/').pop();
    if (fileName) {
      referencedFiles.add(fileName);
    }
  });

  // Find orphaned files
  const orphanedFiles = dirFiles.filter((file) => !referencedFiles.has(file.name));

  // Delete orphaned files
  let deletedCount = 0;
  for (const file of orphanedFiles) {
    try {
      await file.delete();
      deletedCount++;
    } catch (error) {
      console.error(`Failed to delete orphaned file ${file.name}:`, error);
    }
  }

  return deletedCount;
}

export const mediaStorage = {
  saveMediaFile,
  getMediaUri,
  deleteMediaFile,
  getStorageQuota,
  cleanupOrphanedMedia,
};
