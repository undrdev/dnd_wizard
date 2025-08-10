import React, { useState } from 'react';
import {
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  StarIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { ImageUpload } from './ImageUpload';
import { ImageEditor } from './ImageEditor';
import { UploadResult } from '@/lib/imageStorage';
import { LoadingSpinner } from './LoadingSpinner';

interface ImageItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  isPrimary?: boolean;
  metadata?: {
    name: string;
    size: number;
    timeCreated: string;
  };
}

interface ImageGalleryProps {
  images: ImageItem[];
  entityType: 'npc' | 'location' | 'campaign' | 'user';
  entityId: string;
  onImagesChange?: (images: ImageItem[]) => void;
  onImageDelete?: (imageId: string) => void;
  onImageUpdate?: (imageId: string, updates: Partial<ImageItem>) => void;
  onSetPrimary?: (imageId: string) => void;
  maxImages?: number;
  allowUpload?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  showCaptions?: boolean;
  className?: string;
}

export function ImageGallery({
  images,
  entityType,
  entityId,
  onImagesChange,
  onImageDelete,
  onImageUpdate,
  onSetPrimary,
  maxImages = 20,
  allowUpload = true,
  allowEdit = true,
  allowDelete = true,
  showCaptions = true,
  className = '',
}: ImageGalleryProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [editingImage, setEditingImage] = useState<{ file: File; imageId?: string } | null>(null);
  const [viewingImage, setViewingImage] = useState<number | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUploadComplete = (results: UploadResult[]) => {
    const newImages: ImageItem[] = results.map(result => ({
      id: crypto.randomUUID(),
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
      caption: '',
      isPrimary: images.length === 0, // First image becomes primary
      metadata: result.metadata,
    }));

    onImagesChange?.([...images, ...newImages]);
    setShowUpload(false);
  };

  const handleImageDelete = async (imageId: string) => {
    if (!allowDelete) return;
    
    if (confirm('Are you sure you want to delete this image?')) {
      setIsLoading(true);
      try {
        await onImageDelete?.(imageId);
        const updatedImages = images.filter(img => img.id !== imageId);
        onImagesChange?.(updatedImages);
      } catch (error) {
        console.error('Error deleting image:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSetPrimary = (imageId: string) => {
    if (!onSetPrimary) return;
    
    const updatedImages = images.map(img => ({
      ...img,
      isPrimary: img.id === imageId,
    }));
    
    onImagesChange?.(updatedImages);
    onSetPrimary(imageId);
  };

  const handleCaptionEdit = (imageId: string, currentCaption: string) => {
    setEditingCaption(imageId);
    setCaptionText(currentCaption || '');
  };

  const handleCaptionSave = (imageId: string) => {
    onImageUpdate?.(imageId, { caption: captionText });
    const updatedImages = images.map(img =>
      img.id === imageId ? { ...img, caption: captionText } : img
    );
    onImagesChange?.(updatedImages);
    setEditingCaption(null);
    setCaptionText('');
  };

  const handleCaptionCancel = () => {
    setEditingCaption(null);
    setCaptionText('');
  };

  const handleImageView = (index: number) => {
    setViewingImage(index);
  };

  const handlePrevImage = () => {
    if (viewingImage !== null && viewingImage > 0) {
      setViewingImage(viewingImage - 1);
    }
  };

  const handleNextImage = () => {
    if (viewingImage !== null && viewingImage < images.length - 1) {
      setViewingImage(viewingImage + 1);
    }
  };

  const canUpload = allowUpload && images.length < maxImages;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Images ({images.length}{maxImages && `/${maxImages}`})
        </h3>
        {canUpload && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Images</span>
          </button>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium">Upload Images</h3>
              <button
                onClick={() => setShowUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <ImageUpload
                entityType={entityType}
                entityId={entityId}
                maxFiles={maxImages - images.length}
                onUploadComplete={handleUploadComplete}
                onUploadError={(error) => console.error('Upload error:', error)}
                generateThumbnails={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Image Editor Modal */}
      {editingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <ImageEditor
              file={editingImage.file}
              onSave={(editedFile) => {
                // Handle edited file - would need to re-upload
                console.log('Edited file:', editedFile);
                setEditingImage(null);
              }}
              onCancel={() => setEditingImage(null)}
            />
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingImage !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-full max-h-full p-4">
            <img
              src={images[viewingImage].url}
              alt={images[viewingImage].caption || 'Image'}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  disabled={viewingImage === 0}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full disabled:opacity-30"
                >
                  <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={handleNextImage}
                  disabled={viewingImage === images.length - 1}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full disabled:opacity-30"
                >
                  <ChevronRightIcon className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Close button */}
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            {/* Image info */}
            {showCaptions && images[viewingImage].caption && (
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded">
                <p>{images[viewingImage].caption}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Images Grid */}
      {images.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No images uploaded yet</p>
          {canUpload && (
            <button
              onClick={() => setShowUpload(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Upload First Image
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div key={image.id} className="relative group">
              {/* Image */}
              <div
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => handleImageView(index)}
              >
                <img
                  src={image.thumbnailUrl || image.url}
                  alt={image.caption || 'Image'}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>

              {/* Primary indicator */}
              {image.isPrimary && (
                <div className="absolute top-2 left-2">
                  <StarIconSolid className="h-5 w-5 text-yellow-400" />
                </div>
              )}

              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleImageView(index)}
                    className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100"
                    title="View"
                  >
                    <EyeIcon className="h-4 w-4 text-gray-700" />
                  </button>
                  
                  {!image.isPrimary && onSetPrimary && (
                    <button
                      onClick={() => handleSetPrimary(image.id)}
                      className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100"
                      title="Set as primary"
                    >
                      <StarIcon className="h-4 w-4 text-gray-700" />
                    </button>
                  )}

                  {allowDelete && (
                    <button
                      onClick={() => handleImageDelete(image.id)}
                      className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4 text-red-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Caption */}
              {showCaptions && (
                <div className="mt-2">
                  {editingCaption === image.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={captionText}
                        onChange={(e) => setCaptionText(e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                        placeholder="Enter caption..."
                        autoFocus
                      />
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleCaptionSave(image.id)}
                          className="px-2 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCaptionCancel}
                          className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-xs text-gray-600 cursor-pointer hover:text-gray-800"
                      onClick={() => handleCaptionEdit(image.id, image.caption || '')}
                    >
                      {image.caption || 'Add caption...'}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg flex items-center space-x-3">
            <LoadingSpinner size="md" />
            <span>Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}
