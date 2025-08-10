// Firebase Storage temporarily disabled for MVP deployment
// This file provides stub implementations to prevent build errors

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
 * Image Storage Service - MVP Version (Storage Disabled)
 * Provides stub implementations to prevent build errors
 */
class ImageStorageService {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  /**
   * Upload an image file to Firebase Storage
   * TEMPORARILY DISABLED FOR MVP - Returns error message
   */
  async uploadImage(
    file: File,
    type: 'npc' | 'location' | 'campaign' | 'user',
    entityId: string,
    options: UploadOptions = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    throw new Error('Image uploads are temporarily disabled. Feature coming soon!');
  }

  /**
   * Delete an image from Firebase Storage
   * TEMPORARILY DISABLED FOR MVP
   */
  async deleteImage(path: string): Promise<void> {
    throw new Error('Image deletion is temporarily disabled. Feature coming soon!');
  }

  /**
   * Get storage quota information
   * TEMPORARILY DISABLED FOR MVP
   */
  async getStorageQuota(): Promise<StorageQuota> {
    return {
      used: 0,
      available: 0,
      percentage: 0,
    };
  }

  /**
   * Upload multiple images in bulk
   * TEMPORARILY DISABLED FOR MVP
   */
  async uploadBulk(
    files: File[],
    type: 'npc' | 'location' | 'campaign' | 'user',
    entityId: string,
    options: UploadOptions = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<BulkUploadResult> {
    throw new Error('Bulk image uploads are temporarily disabled. Feature coming soon!');
  }

  /**
   * List all images for an entity
   * TEMPORARILY DISABLED FOR MVP
   */
  async listImages(
    type: 'npc' | 'location' | 'campaign' | 'user',
    entityId: string
  ): Promise<UploadResult[]> {
    return [];
  }

  /**
   * Update image metadata
   * TEMPORARILY DISABLED FOR MVP
   */
  async updateImageMetadata(
    path: string,
    metadata: Record<string, string>
  ): Promise<void> {
    throw new Error('Image metadata updates are temporarily disabled. Feature coming soon!');
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
   * Clean up orphaned images
   * TEMPORARILY DISABLED FOR MVP
   */
  async cleanupOrphanedImages(): Promise<number> {
    return 0;
  }
}

// Export singleton instance
export const imageStorage = new ImageStorageService();

// Export class for testing
export { ImageStorageService };
