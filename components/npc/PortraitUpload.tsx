import React, { useState, useRef, useCallback } from 'react';
import { PhotoIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface PortraitUploadProps {
  currentPortraitUrl?: string;
  onPortraitChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export function PortraitUpload({
  currentPortraitUrl,
  onPortraitChange,
  disabled = false,
  className = '',
}: PortraitUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Convert to base64 for now (in a real app, you'd upload to Firebase Storage)
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onPortraitChange(result);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError('Failed to read image file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading portrait:', error);
      setError('Failed to upload image');
      setIsUploading(false);
    }
  }, [onPortraitChange]);

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

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [disabled, isUploading, handleFileSelect]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle click to open file dialog
  const handleClick = useCallback(() => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  }, [disabled, isUploading]);

  // Remove current portrait
  const handleRemove = useCallback(() => {
    if (disabled || isUploading) return;
    onPortraitChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [disabled, isUploading, onPortraitChange]);

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
          {!disabled && !isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
              title="Remove portrait"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
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
          disabled={disabled || isUploading}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <LoadingSpinner size="md" />
            <p className="mt-2 text-sm text-gray-600">Uploading...</p>
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
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        Upload a portrait image for this NPC. This will be displayed on the map and in NPC cards.
      </p>
    </div>
  );
}
