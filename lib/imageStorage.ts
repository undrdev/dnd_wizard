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

export class ImageStorageService {
  private static instance: ImageStorageService;

  static getInstance(): ImageStorageService {
    if (!ImageStorageService.instance) {
      ImageStorageService.instance = new ImageStorageService();
    }
    return ImageStorageService.instance;
  }

  /**
   * Generate a storage path for an image
   */
  private generatePath(
    type: 'npc' | 'location' | 'campaign' | 'user',
    entityId: string,
    filename: string
  ): string {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated to upload images');
    }

    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    switch (type) {
      case 'npc':
        return `campaigns/${entityId}/npcs/${timestamp}_${sanitizedFilename}`;
      case 'location':
        return `campaigns/${entityId}/locations/${timestamp}_${sanitizedFilename}`;
      case 'campaign':
        return `campaigns/${entityId}/assets/${timestamp}_${sanitizedFilename}`;
      case 'user':
        return `users/${userId}/${timestamp}_${sanitizedFilename}`;
      default:
        throw new Error(`Invalid image type: ${type}`);
    }
  }

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
                contentType: metadata.contentType || '',
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
   * Delete an image from Firebase Storage
   */
  async deleteImage(path: string): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to delete images');
    }

    try {
      const imageRef = ref(storage, path);
      await deleteObject(imageRef);

      // Also try to delete thumbnail if it exists
      const thumbnailPath = path.replace(/([^/]+)$/, 'thumb_$1').replace(/\.[^/.]+$/, '.jpg');
      try {
        const thumbnailRef = ref(storage, thumbnailPath);
        await deleteObject(thumbnailRef);
      } catch (error) {
        // Thumbnail might not exist, ignore error
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error(`Failed to delete image: ${error}`);
    }
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

    const basePath = this.generatePath(type, entityId, '').replace(/\/[^/]*$/, '');
    const listRef = ref(storage, basePath);

    try {
      const result = await listAll(listRef);
      const images: UploadResult[] = [];

      for (const itemRef of result.items) {
        // Skip thumbnails
        if (itemRef.name.startsWith('thumb_')) continue;

        const url = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);

        // Check if thumbnail exists
        const thumbnailPath = `${basePath}/thumb_${itemRef.name.replace(/\.[^/.]+$/, '.jpg')}`;
        let thumbnailUrl: string | undefined;
        try {
          const thumbnailRef = ref(storage, thumbnailPath);
          thumbnailUrl = await getDownloadURL(thumbnailRef);
        } catch (error) {
          // Thumbnail doesn't exist
        }

        images.push({
          url,
          path: itemRef.fullPath,
          thumbnailUrl,
          metadata: {
            size: metadata.size,
            contentType: metadata.contentType || '',
            timeCreated: metadata.timeCreated,
            name: metadata.name,
          },
        });
      }

      return images.sort((a, b) => 
        new Date(b.metadata.timeCreated).getTime() - new Date(a.metadata.timeCreated).getTime()
      );
    } catch (error) {
      console.error('Error listing images:', error);
      throw new Error(`Failed to list images: ${error}`);
    }
  }

  /**
   * Get storage quota usage for a user
   */
  async getStorageUsage(): Promise<{ used: number; limit: number }> {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to check storage usage');
    }

    // This is a simplified implementation
    // In a real app, you'd track this in Firestore or use Cloud Functions
    const userPath = `users/${auth.currentUser.uid}`;
    const userRef = ref(storage, userPath);

    try {
      const result = await listAll(userRef);
      let totalSize = 0;

      for (const itemRef of result.items) {
        const metadata = await getMetadata(itemRef);
        totalSize += metadata.size;
      }

      // 100MB limit per user (adjust as needed)
      const limit = 100 * 1024 * 1024;

      return { used: totalSize, limit };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return { used: 0, limit: 100 * 1024 * 1024 };
    }
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: File): void {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }

    // Check file name
    if (!file.name || file.name.length > 100) {
      throw new Error('Invalid file name');
    }
  }
}

// Export singleton instance
export const imageStorage = ImageStorageService.getInstance();
