import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  ScissorsIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cropImage, convertImageFormat, getImageDimensions } from '@/lib/imageProcessing';
import { LoadingSpinner } from './LoadingSpinner';

interface ImageEditorProps {
  file: File;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
  className?: string;
}

interface EditState {
  crop: Crop;
  zoom: number;
  rotation: number;
  format: 'jpeg' | 'png' | 'webp';
  quality: number;
  aspect?: number;
}

export function ImageEditor({ file, onSave, onCancel, className = '' }: ImageEditorProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [editState, setEditState] = useState<EditState>({
    crop: {
      unit: '%',
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    },
    zoom: 1,
    rotation: 0,
    format: 'jpeg',
    quality: 0.9,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  
  const imgRef = useRef<HTMLImageElement>(null);

  // Initialize image URL and dimensions
  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    getImageDimensions(file)
      .then(setImageDimensions)
      .catch(console.error);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleCropChange = useCallback((crop: Crop, percentCrop: Crop) => {
    setEditState(prev => ({ ...prev, crop: percentCrop }));
  }, []);

  const handleCropComplete = useCallback((crop: PixelCrop) => {
    setCompletedCrop(crop);
  }, []);

  const handleFormatChange = (format: 'jpeg' | 'png' | 'webp') => {
    setEditState(prev => ({ ...prev, format }));
  };

  const handleQualityChange = (quality: number) => {
    setEditState(prev => ({ ...prev, quality }));
  };

  const handleSave = async () => {
    if (!completedCrop || !imgRef.current) {
      setError('Please select a crop area');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create cropped image
      const croppedFile = await cropImage(file, {
        x: completedCrop.x,
        y: completedCrop.y,
        width: completedCrop.width,
        height: completedCrop.height,
      });

      // Convert format if needed
      let finalFile = croppedFile;
      if (editState.format !== file.type.split('/')[1]) {
        finalFile = await convertImageFormat(croppedFile, editState.format, editState.quality);
      }

      onSave(finalFile);
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCrop = () => {
    setEditState(prev => ({
      ...prev,
      crop: {
        unit: '%',
        x: 10,
        y: 10,
        width: 80,
        height: 80,
      },
    }));
  };

  const setCropAspectRatio = (aspectRatio: number | undefined) => {
    setEditState(prev => ({
      ...prev,
      aspect: aspectRatio,
    }));
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-medium text-gray-900">Edit Image</h3>
        <div className="flex space-x-2">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isProcessing || !completedCrop}
            className="px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {isProcessing ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Main Editor */}
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Image Crop Area */}
          <div className="lg:col-span-2">
            <div className="bg-gray-100 rounded-lg p-4">
              {imageUrl && (
                <ReactCrop
                  crop={editState.crop}
                  onChange={handleCropChange}
                  onComplete={handleCropComplete}
                  aspect={editState.aspect}
                  className="max-w-full"
                >
                  <img
                    ref={imgRef}
                    src={imageUrl}
                    alt="Edit preview"
                    className="max-w-full h-auto"
                    style={{
                      transform: `scale(${editState.zoom}) rotate(${editState.rotation}deg)`,
                    }}
                  />
                </ReactCrop>
              )}
            </div>

            {/* Image Info */}
            {imageDimensions && (
              <div className="mt-2 text-sm text-gray-600">
                Original: {imageDimensions.width} × {imageDimensions.height}px
                {completedCrop && (
                  <span className="ml-4">
                    Crop: {Math.round(completedCrop.width)} × {Math.round(completedCrop.height)}px
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Crop Controls */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Crop</h4>
              <div className="space-y-3">
                <button
                  onClick={resetCrop}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center space-x-2"
                >
                  <ScissorsIcon className="h-4 w-4" />
                  <span>Reset Crop</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCropAspectRatio(1)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    1:1
                  </button>
                  <button
                    onClick={() => setCropAspectRatio(16/9)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    16:9
                  </button>
                  <button
                    onClick={() => setCropAspectRatio(4/3)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    4:3
                  </button>
                  <button
                    onClick={() => setCropAspectRatio(undefined)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Free
                  </button>
                </div>
              </div>
            </div>

            {/* Format Controls */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Format</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {(['jpeg', 'png', 'webp'] as const).map((format) => (
                    <button
                      key={format}
                      onClick={() => handleFormatChange(format)}
                      className={`px-2 py-1 text-xs rounded border ${
                        editState.format === format
                          ? 'bg-primary-100 border-primary-300 text-primary-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Quality Slider (only for JPEG and WebP) */}
                {(editState.format === 'jpeg' || editState.format === 'webp') && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Quality: {Math.round(editState.quality * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={editState.quality}
                      onChange={(e) => handleQualityChange(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* File Info */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">File Info</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Name: {file.name}</div>
                <div>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</div>
                <div>Type: {file.type}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
