import React, { useState, useRef, useCallback } from 'react';
import { PhotoIcon, XMarkIcon, ArrowUpTrayIcon, PencilIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useImageUpload } from '@/hooks/useImageUpload';
import { ImageEditor } from '@/components/ui/ImageEditor';
import { validateImageFile } from '@/lib/imageProcessing';

interface PortraitUploadProps {
  currentPortraitUrl?: string;
  onPortraitChange: (url: string | null) => void;
  npcId?: string;
  campaignId: string;
  disabled?: boolean;
  className?: string;
  allowEdit?: boolean;
}

export function PortraitUpload({
  currentPortraitUrl,
  onPortraitChange,
  npcId,
  campaignId,
  disabled = false,
  className = '',
  allowEdit = true,
}: PortraitUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadSingleFile, uploadState } = useImageUpload({
    uploadOptions: {
      resize: { width: 400, height: 400 },
      quality: 0.9,
      generateThumbnail: true,
      thumbnailSize: { width: 150, height: 150 },
    },
  });

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setError(null);

    try {
      // Use npcId if available, otherwise use a temporary ID
      const entityId = npcId || `temp_${Date.now()}`;

      const result = await uploadSingleFile(file, 'npc', entityId);
      onPortraitChange(result.url);
    } catch (error) {
      console.error('Error uploading portrait:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload image');
    }
  }, [uploadSingleFile, onPortraitChange, npcId]);

  const handleEditFile = useCallback((file: File) => {
    setEditingFile(file);
  }, []);

  const handleEditSave = useCallback(async (editedFile: File) => {
    setEditingFile(null);
    await handleFileSelect(editedFile);
  }, [handleFileSelect]);

  const handleEditCancel = useCallback(() => {
    setEditingFile(null);
  }, []);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || uploadState.isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [disabled, uploadState.isUploading, handleFileSelect]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle click to open file dialog
  const handleClick = useCallback(() => {
    if (disabled || uploadState.isUploading) return;
    fileInputRef.current?.click();
  }, [disabled, uploadState.isUploading]);

  // Remove current portrait
  const handleRemove = useCallback(() => {
    if (disabled || uploadState.isUploading) return;
    onPortraitChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [disabled, uploadState.isUploading, onPortraitChange]);

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Portrait
      </label>
      
      {/* Current Portrait Display */}
      {currentPortraitUrl && (
        <div className="relative inline-block">
          <img
            src={currentPortraitUrl}
            alt="NPC Portrait"
            className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
          />
          {!disabled && !uploadState.isUploading && (
            <div className="absolute -top-2 -right-2 flex space-x-1">
              {allowEdit && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 transition-colors"
                  title="Edit portrait"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={handleRemove}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                title="Remove portrait"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled || uploadState.isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          disabled={disabled || uploadState.isUploading}
          className="hidden"
        />

        {uploadState.isUploading ? (
          <div className="flex flex-col items-center">
            <LoadingSpinner size="md" />
            <p className="mt-2 text-sm text-gray-600">
              Uploading... {Math.round(uploadState.progress)}%
            </p>
            <div className="w-full max-w-xs mt-2 bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {currentPortraitUrl ? (
              <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 mb-2" />
            ) : (
              <PhotoIcon className="h-8 w-8 text-gray-400 mb-2" />
            )}
            <p className="text-sm text-gray-600">
              {currentPortraitUrl ? 'Click or drag to replace' : 'Click or drag to upload'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {(error || uploadState.error) && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error || uploadState.error}
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        Upload a portrait image for this NPC. This will be displayed on the map and in NPC cards.
      </p>

      {/* Image Editor Modal */}
      {editingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ImageEditor
              file={editingFile}
              onSave={handleEditSave}
              onCancel={handleEditCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
