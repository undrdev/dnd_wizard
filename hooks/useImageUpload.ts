import { useState, useCallback, useRef } from 'react';
import { imageStorage, UploadOptions, UploadResult, UploadProgress } from '@/lib/imageStorage';
import { validateImageFile } from '@/lib/imageProcessing';

export interface UseImageUploadOptions {
  maxFiles?: number;
  autoUpload?: boolean;
  uploadOptions?: UploadOptions;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedFiles: UploadResult[];
  pendingFiles: File[];
}

export interface UseImageUploadReturn {
  uploadState: UploadState;
  uploadFiles: (
    files: File[],
    type: 'npc' | 'location' | 'campaign' | 'user',
    entityId: string
  ) => Promise<UploadResult[]>;
  uploadSingleFile: (
    file: File,
    type: 'npc' | 'location' | 'campaign' | 'user',
    entityId: string
  ) => Promise<UploadResult>;
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  clearError: () => void;
  cancelUpload: () => void;
}

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const {
    maxFiles = 10,
    autoUpload = false,
    uploadOptions = {},
  } = options;

  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    uploadedFiles: [],
    pendingFiles: [],
  });

  const uploadAbortController = useRef<AbortController | null>(null);

  const updateState = useCallback((updates: Partial<UploadState>) => {
    setUploadState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const clearFiles = useCallback(() => {
    updateState({
      pendingFiles: [],
      uploadedFiles: [],
      progress: 0,
      error: null,
    });
  }, [updateState]);

  const addFiles = useCallback((files: File[]) => {
    const validFiles: File[] = [];
    let errorMessage: string | null = null;

    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        errorMessage = validation.error || 'Invalid file';
        break;
      }

      // Check if we're exceeding max files
      if (uploadState.pendingFiles.length + validFiles.length >= maxFiles) {
        errorMessage = `Maximum ${maxFiles} files allowed`;
        break;
      }

      // Check for duplicates
      const isDuplicate = uploadState.pendingFiles.some(
        existing => existing.name === file.name && existing.size === file.size
      );

      if (!isDuplicate) {
        validFiles.push(file);
      }
    }

    if (errorMessage) {
      updateState({ error: errorMessage });
      return;
    }

    updateState({
      pendingFiles: [...uploadState.pendingFiles, ...validFiles],
      error: null,
    });
  }, [uploadState.pendingFiles, maxFiles, updateState]);

  const removeFile = useCallback((index: number) => {
    updateState({
      pendingFiles: uploadState.pendingFiles.filter((_, i) => i !== index),
    });
  }, [uploadState.pendingFiles, updateState]);

  const cancelUpload = useCallback(() => {
    if (uploadAbortController.current) {
      uploadAbortController.current.abort();
      uploadAbortController.current = null;
    }
    updateState({
      isUploading: false,
      progress: 0,
    });
  }, [updateState]);

  const uploadSingleFile = useCallback(async (
    file: File,
    type: 'npc' | 'location' | 'campaign' | 'user',
    entityId: string
  ): Promise<UploadResult> => {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file');
    }

    updateState({
      isUploading: true,
      progress: 0,
      error: null,
    });

    try {
      const result = await imageStorage.uploadImage(
        file,
        type,
        entityId,
        uploadOptions,
        (progress: UploadProgress) => {
          updateState({ progress: progress.progress });
        }
      );

      updateState({
        isUploading: false,
        progress: 100,
        uploadedFiles: [...uploadState.uploadedFiles, result],
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      updateState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
      });
      throw error;
    }
  }, [uploadOptions, uploadState.uploadedFiles, updateState]);

  const uploadFiles = useCallback(async (
    files: File[],
    type: 'npc' | 'location' | 'campaign' | 'user',
    entityId: string
  ): Promise<UploadResult[]> => {
    if (files.length === 0) {
      return [];
    }

    updateState({
      isUploading: true,
      progress: 0,
      error: null,
    });

    const results: UploadResult[] = [];
    const totalFiles = files.length;
    let completedFiles = 0;

    // Create abort controller for this upload session
    uploadAbortController.current = new AbortController();

    try {
      for (const file of files) {
        // Check if upload was cancelled
        if (uploadAbortController.current.signal.aborted) {
          throw new Error('Upload cancelled');
        }

        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
          throw new Error(`${file.name}: ${validation.error}`);
        }

        try {
          const result = await imageStorage.uploadImage(
            file,
            type,
            entityId,
            uploadOptions,
            (progress: UploadProgress) => {
              const fileProgress = progress.progress / totalFiles;
              const totalProgress = (completedFiles / totalFiles) * 100 + fileProgress;
              updateState({ progress: Math.min(totalProgress, 100) });
            }
          );

          results.push(result);
          completedFiles++;

          // Update progress
          const overallProgress = (completedFiles / totalFiles) * 100;
          updateState({ progress: overallProgress });

        } catch (fileError) {
          console.error(`Error uploading ${file.name}:`, fileError);
          // Continue with other files, but log the error
          completedFiles++;
        }
      }

      updateState({
        isUploading: false,
        progress: 100,
        uploadedFiles: [...uploadState.uploadedFiles, ...results],
        pendingFiles: [], // Clear pending files after successful upload
      });

      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      updateState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
      });
      throw error;
    } finally {
      uploadAbortController.current = null;
    }
  }, [uploadOptions, uploadState.uploadedFiles, updateState]);

  return {
    uploadState,
    uploadFiles,
    uploadSingleFile,
    addFiles,
    removeFile,
    clearFiles,
    clearError,
    cancelUpload,
  };
}

/**
 * Hook for managing image uploads with drag and drop support
 */
export function useImageDropzone(options: UseImageUploadOptions = {}) {
  const imageUpload = useImageUpload(options);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      imageUpload.addFiles(imageFiles);
    }
  }, [imageUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      imageUpload.addFiles(Array.from(files));
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [imageUpload]);

  return {
    ...imageUpload,
    isDragActive,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
    handleFileInput,
  };
}
