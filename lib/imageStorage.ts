import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata,
} from 'firebase/storage';
import { storage } from './firebase';
import { auth } from './firebase';

export interface UploadOptions {
  resize?: { width: number; height: number };
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  generateThumbnail?: boolean;
  thumbnailSize?: { width: number; height: number };
}

export interface UploadResult {
  url: string;
  path: string;
  thumbnailUrl?: string;
  metadata: {
    size: number;
    contentType: string;
    timeCreated: string;
    name: string;
  };
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
}

export interface StorageQuota {
  used: number;
  available: number;
  percentage: number;
}

export interface BulkUploadResult {
  successful: UploadResult[];
  failed: Array<{ file: File; error: string }>;
  totalUploaded: number;
  totalFailed: number;
}

/**
 * Image Storage Service
 * Handles all image upload, storage, and management operations
 */
class ImageStorageService {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  /**
   * Upload an image file to Firebase Storage
   */
  async uploadImage(
    file: File,
    type: 'npc' | 'location' | 'campaign' | 'user',
    entityId: string,
    options: UploadOptions = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to upload images');
    }

    // Validate file
    this.validateFile(file);

    // Generate storage path
    const path = this.generatePath(type, entityId, file.name);
    const storageRef = ref(storage, path);

    // Process image if options are provided
    let processedFile = file;
    if (options.resize || options.quality || options.format) {
      const { processImage } = await import('./imageProcessing');
      processedFile = await processImage(file, options);
    }

    // Upload file with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, processedFile, {
      contentType: processedFile.type,
      customMetadata: {
        originalName: file.name,
        uploadedBy: auth.currentUser.uid,
        entityType: type,
        entityId: entityId,
      },
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (onProgress) {
            const progress: UploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              state: snapshot.state as any,
            };
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Upload error:', error);
          reject(new Error(`Upload failed: ${error.message}`));
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            const metadata = await getMetadata(uploadTask.snapshot.ref);

            let thumbnailUrl: string | undefined;
            if (options.generateThumbnail) {
              thumbnailUrl = await this.generateThumbnail(
                processedFile,
                type,
                entityId,
                options.thumbnailSize || { width: 150, height: 150 }
              );
            }

            const result: UploadResult = {
              url,
              path,
              thumbnailUrl,
              metadata: {
                size: metadata.size,
                contentType: metadata.contentType || processedFile.type,
                timeCreated: metadata.timeCreated,
                name: metadata.name,
              },
            };

            resolve(result);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  /**
   * Delete an image from Firebase Storage
   */
  async deleteImage(path: string): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to delete images');
    }

    try {
      const imageRef = ref(storage, path);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Delete error:', error);
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get storage quota information
   */
  async getStorageQuota(): Promise<StorageQuota> {
    // Note: Firebase Storage doesn't provide direct quota API
    // This is a placeholder implementation
    return {
      used: 0,
      available: 1024 * 1024 * 1024, // 1GB placeholder
      percentage: 0,
    };
  }

  /**
   * Upload multiple images in bulk
   */
  async uploadBulk(
    files: File[],
    type: 'npc' | 'location' | 'campaign' | 'user',
    entityId: string,
    options: UploadOptions = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<BulkUploadResult> {
    const results: UploadResult[] = [];
    const failed: Array<{ file: File; error: string }> = [];
    let completedFiles = 0;
    const totalFiles = files.length;

    for (const file of files) {
      try {
        const result = await this.uploadImage(
          file,
          type,
          entityId,
          options,
          (progress: UploadProgress) => {
            const fileProgress = progress.progress / totalFiles;
            const totalProgress = (completedFiles / totalFiles) * 100 + fileProgress;
            if (onProgress) {
              onProgress({
                ...progress,
                progress: Math.min(totalProgress, 100),
              });
            }
          }
        );

        results.push(result);
        completedFiles++;
      } catch (error) {
        failed.push({
          file,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        completedFiles++;
      }
    }

    return {
      successful: results,
      failed,
      totalUploaded: results.length,
      totalFailed: failed.length,
    };
  }

  /**
   * List all images for an entity
   */
  async listImages(
    type: 'npc' | 'location' | 'campaign' | 'user',
    entityId: string
  ): Promise<UploadResult[]> {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to list images');
    }

    try {
      const folderRef = ref(storage, `${type}s/${entityId}`);
      const listResult = await listAll(folderRef);

      const images: UploadResult[] = [];
      for (const itemRef of listResult.items) {
        try {
          const [url, metadata] = await Promise.all([
            getDownloadURL(itemRef),
            getMetadata(itemRef),
          ]);

          images.push({
            url,
            path: itemRef.fullPath,
            metadata: {
              size: metadata.size,
              contentType: metadata.contentType || 'image/jpeg',
              timeCreated: metadata.timeCreated,
              name: metadata.name,
            },
          });
        } catch (error) {
          console.warn(`Failed to get metadata for ${itemRef.fullPath}:`, error);
        }
      }

      return images;
    } catch (error) {
      console.error('List images error:', error);
      throw new Error(`Failed to list images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update image metadata
   */
  async updateImageMetadata(
    path: string,
    metadata: Record<string, string>
  ): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to update metadata');
    }

    try {
      const imageRef = ref(storage, path);
      await updateMetadata(imageRef, { customMetadata: metadata });
    } catch (error) {
      console.error('Update metadata error:', error);
      throw new Error(`Failed to update metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): void {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`File type ${file.type} is not supported. Allowed types: ${this.ALLOWED_TYPES.join(', ')}`);
    }
  }

  /**
   * Generate storage path for file
   */
  private generatePath(
    type: 'npc' | 'location' | 'campaign' | 'user',
    entityId: string,
    fileName: string
  ): string {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${type}s/${entityId}/${timestamp}_${sanitizedFileName}`;
  }

  /**
   * Generate a thumbnail for an image
   */
  private async generateThumbnail(
    file: File,
    type: 'npc' | 'location' | 'campaign' | 'user',
    entityId: string,
    size: { width: number; height: number }
  ): Promise<string> {
    const { processImage } = await import('./imageProcessing');
    
    const thumbnailFile = await processImage(file, {
      resize: size,
      quality: 0.8,
      format: 'jpeg',
    });

    const thumbnailPath = this.generatePath(
      type,
      entityId,
      `thumb_${file.name.replace(/\.[^/.]+$/, '.jpg')}`
    );
    
    const thumbnailRef = ref(storage, thumbnailPath);
    await uploadBytes(thumbnailRef, thumbnailFile);
    
    return getDownloadURL(thumbnailRef);
  }

  /**
   * Clean up orphaned images
   */
  async cleanupOrphanedImages(): Promise<number> {
    // Implementation would require checking against database records
    // This is a placeholder for future implementation
    return 0;
  }
}

// Export singleton instance
export const imageStorage = new ImageStorageService();

// Export class for testing
export { ImageStorageService };
