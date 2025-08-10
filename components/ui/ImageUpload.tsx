import React, { useRef } from 'react';
import { PhotoIcon, XMarkIcon, ArrowUpTrayIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useImageDropzone } from '@/hooks/useImageUpload';
import { LoadingSpinner } from './LoadingSpinner';
import { UploadResult } from '@/lib/imageStorage';

interface ImageUploadProps {
  onUploadComplete?: (results: UploadResult[]) => void;
  onUploadError?: (error: string) => void;
  entityType: 'npc' | 'location' | 'campaign' | 'user';
  entityId: string;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
  autoUpload?: boolean;
  generateThumbnails?: boolean;
  acceptedFormats?: string[];
  children?: React.ReactNode;
}

export function ImageUpload({
  onUploadComplete,
  onUploadError,
  entityType,
  entityId,
  maxFiles = 5,
  disabled = false,
  className = '',
  showPreview = true,
  autoUpload = true,
  generateThumbnails = true,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  children,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    uploadState,
    uploadFiles,
    addFiles,
    removeFile,
    clearFiles,
    clearError,
    cancelUpload,
    isDragActive,
    dragHandlers,
    handleFileInput,
  } = useImageDropzone({
    maxFiles,
    autoUpload: false, // We'll handle upload manually
    uploadOptions: {
      generateThumbnail: generateThumbnails,
      quality: 0.8,
    },
  });

  const handleUpload = async () => {
    if (uploadState.pendingFiles.length === 0) return;

    try {
      const results = await uploadFiles(uploadState.pendingFiles, entityType, entityId);
      onUploadComplete?.(results);
      clearFiles();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
    }
  };

  const handleFileSelect = () => {
    if (disabled || uploadState.isUploading) return;
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index: number) => {
    removeFile(index);
  };

  const handleClearAll = () => {
    clearFiles();
    clearError();
  };

  // Auto upload when files are added
  React.useEffect(() => {
    if (autoUpload && uploadState.pendingFiles.length > 0 && !uploadState.isUploading) {
      handleUpload();
    }
  }, [uploadState.pendingFiles.length, autoUpload]);

  const acceptString = acceptedFormats.join(',');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer
          ${isDragActive 
            ? 'border-primary-500 bg-primary-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${disabled || uploadState.isUploading 
            ? 'opacity-50 cursor-not-allowed' 
            : ''
          }
        `}
        {...dragHandlers}
        onClick={handleFileSelect}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptString}
          multiple={maxFiles > 1}
          onChange={handleFileInput}
          disabled={disabled || uploadState.isUploading}
          className="hidden"
        />

        {uploadState.isUploading ? (
          <div className="flex flex-col items-center">
            <LoadingSpinner size="lg" />
            <p className="mt-2 text-sm text-gray-600">
              Uploading... {Math.round(uploadState.progress)}%
            </p>
            <div className="w-full max-w-xs mt-2 bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                cancelUpload();
              }}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {children || (
              <>
                <PhotoIcon className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {isDragActive ? 'Drop images here' : 'Upload images'}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop or click to select
                </p>
                <p className="text-xs text-gray-500">
                  {acceptedFormats.map(format => format.split('/')[1].toUpperCase()).join(', ')} up to 5MB each
                </p>
                {maxFiles > 1 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum {maxFiles} files
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {uploadState.error && (
        <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-sm text-red-700 flex-1">{uploadState.error}</span>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Pending Files Preview */}
      {showPreview && uploadState.pendingFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Selected Files ({uploadState.pendingFiles.length})
            </h4>
            <button
              onClick={handleClearAll}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {uploadState.pendingFiles.map((file, index) => (
              <FilePreview
                key={`${file.name}-${index}`}
                file={file}
                onRemove={() => handleRemoveFile(index)}
              />
            ))}
          </div>

          {!autoUpload && (
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploadState.isUploading}
                className="px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                Upload {uploadState.pendingFiles.length} file{uploadState.pendingFiles.length !== 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadState.uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            Uploaded Files ({uploadState.uploadedFiles.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {uploadState.uploadedFiles.map((result, index) => (
              <UploadedFilePreview
                key={`${result.path}-${index}`}
                result={result}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

function FilePreview({ file, onRemove }: FilePreviewProps) {
  const [preview, setPreview] = React.useState<string>('');

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="relative group">
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={preview}
          alt={file.name}
          className="w-full h-full object-cover"
        />
      </div>
      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
      <p className="text-xs text-gray-600 mt-1 truncate" title={file.name}>
        {file.name}
      </p>
      <p className="text-xs text-gray-500">
        {(file.size / 1024 / 1024).toFixed(1)} MB
      </p>
    </div>
  );
}

interface UploadedFilePreviewProps {
  result: UploadResult;
}

function UploadedFilePreview({ result }: UploadedFilePreviewProps) {
  return (
    <div className="relative">
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={result.thumbnailUrl || result.url}
          alt={result.metadata.name}
          className="w-full h-full object-cover"
        />
      </div>
      <p className="text-xs text-gray-600 mt-1 truncate" title={result.metadata.name}>
        {result.metadata.name}
      </p>
      <p className="text-xs text-gray-500">
        {(result.metadata.size / 1024 / 1024).toFixed(1)} MB
      </p>
    </div>
  );
}
