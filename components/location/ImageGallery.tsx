import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  XMarkIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  StarIcon,
  PencilIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useLocations } from '@/hooks/useLocations';
import type { EnhancedLocation, LocationImage } from '@/types';

interface ImageGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  location: EnhancedLocation;
}

export function ImageGallery({ isOpen, onClose, location }: ImageGalleryProps) {
  const { addImage, updateImage, removeImage, setPrimaryImage } = useLocations();
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [newCaption, setNewCaption] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');

  const images = location.images || [];
  const selectedImage = images[selectedImageIndex];

  const handlePrevious = () => {
    setSelectedImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
  };

  const handleNext = () => {
    setSelectedImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
  };

  const handleAddImage = async () => {
    if (!newImageUrl.trim()) return;

    setIsUploading(true);
    try {
      const newImage: LocationImage = {
        id: crypto.randomUUID(),
        url: newImageUrl.trim(),
        caption: newImageCaption.trim(),
        isPrimary: images.length === 0, // First image is primary by default
        uploadedAt: new Date(),
      };

      const success = await addImage(location.id, newImage);
      if (success) {
        setNewImageUrl('');
        setNewImageCaption('');
        setShowUploadForm(false);
        setSelectedImageIndex(images.length); // Select the new image
      }
    } catch (error) {
      console.error('Error adding image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateCaption = async (imageId: string) => {
    if (editingCaption !== imageId) return;

    try {
      await updateImage(location.id, imageId, { caption: newCaption });
      setEditingCaption(null);
      setNewCaption('');
    } catch (error) {
      console.error('Error updating caption:', error);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      try {
        const success = await removeImage(location.id, imageId);
        if (success) {
          // Adjust selected index if necessary
          if (selectedImageIndex >= images.length - 1) {
            setSelectedImageIndex(Math.max(0, images.length - 2));
          }
        }
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await setPrimaryImage(location.id, imageId);
    } catch (error) {
      console.error('Error setting primary image:', error);
    }
  };

  const startEditingCaption = (image: LocationImage) => {
    setEditingCaption(image.id);
    setNewCaption(image.caption);
  };

  const cancelEditingCaption = () => {
    setEditingCaption(null);
    setNewCaption('');
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <PhotoIcon className="h-6 w-6 text-blue-600" />
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                        {location.name} - Images
                      </Dialog.Title>
                      <p className="text-sm text-gray-500">
                        {images.length} image{images.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowUploadForm(true)}
                      className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>Add Image</span>
                    </button>
                    
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex h-96">
                  {images.length === 0 ? (
                    /* Empty State */
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No images</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Add images to showcase this location
                        </p>
                        <button
                          onClick={() => setShowUploadForm(true)}
                          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                        >
                          Add First Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Main Image Display */}
                      <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
                        {selectedImage && (
                          <>
                            <img
                              src={selectedImage.url}
                              alt={selectedImage.caption || location.name}
                              className="max-w-full max-h-full object-contain"
                            />
                            
                            {/* Navigation Arrows */}
                            {images.length > 1 && (
                              <>
                                <button
                                  onClick={handlePrevious}
                                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
                                >
                                  <ArrowLeftIcon className="h-5 w-5" />
                                </button>
                                
                                <button
                                  onClick={handleNext}
                                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
                                >
                                  <ArrowRightIcon className="h-5 w-5" />
                                </button>
                              </>
                            )}

                            {/* Image Info Overlay */}
                            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  {editingCaption === selectedImage.id ? (
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="text"
                                        value={newCaption}
                                        onChange={(e) => setNewCaption(e.target.value)}
                                        className="flex-1 px-2 py-1 text-sm text-black rounded"
                                        placeholder="Enter caption..."
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            handleUpdateCaption(selectedImage.id);
                                          } else if (e.key === 'Escape') {
                                            cancelEditingCaption();
                                          }
                                        }}
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => handleUpdateCaption(selectedImage.id)}
                                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={cancelEditingCaption}
                                        className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <p className="text-sm">
                                        {selectedImage.caption || 'No caption'}
                                      </p>
                                      <button
                                        onClick={() => startEditingCaption(selectedImage)}
                                        className="text-gray-300 hover:text-white"
                                      >
                                        <PencilIcon className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-300">
                                    <span>
                                      {selectedImageIndex + 1} of {images.length}
                                    </span>
                                    <span>
                                      Added {new Date(selectedImage.uploadedAt).toLocaleDateString()}
                                    </span>
                                    {selectedImage.isPrimary && (
                                      <span className="flex items-center space-x-1">
                                        <StarIconSolid className="h-3 w-3 text-yellow-400" />
                                        <span>Primary</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 ml-4">
                                  {!selectedImage.isPrimary && (
                                    <button
                                      onClick={() => handleSetPrimary(selectedImage.id)}
                                      className="p-1 text-gray-300 hover:text-yellow-400"
                                      title="Set as primary image"
                                    >
                                      <StarIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => handleDeleteImage(selectedImage.id)}
                                    className="p-1 text-gray-300 hover:text-red-400"
                                    title="Delete image"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Thumbnail Sidebar */}
                      <div className="w-48 bg-gray-50 border-l border-gray-200 overflow-y-auto">
                        <div className="p-4 space-y-2">
                          {images.map((image, index) => (
                            <div
                              key={image.id}
                              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
                                index === selectedImageIndex
                                  ? 'border-blue-500'
                                  : 'border-transparent hover:border-gray-300'
                              }`}
                              onClick={() => setSelectedImageIndex(index)}
                            >
                              <div className="aspect-square">
                                <img
                                  src={image.url}
                                  alt={image.caption || `Image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              
                              {image.isPrimary && (
                                <div className="absolute top-1 right-1">
                                  <StarIconSolid className="h-4 w-4 text-yellow-400" />
                                </div>
                              )}
                              
                              {image.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1">
                                  <p className="text-xs truncate">{image.caption}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Upload Form */}
                {showUploadForm && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Add New Image</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Image URL *
                        </label>
                        <input
                          type="url"
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Caption
                        </label>
                        <input
                          type="text"
                          value={newImageCaption}
                          onChange={(e) => setNewImageCaption(e.target.value)}
                          placeholder="Optional caption for the image"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            setShowUploadForm(false);
                            setNewImageUrl('');
                            setNewImageCaption('');
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddImage}
                          disabled={!newImageUrl.trim() || isUploading}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUploading ? 'Adding...' : 'Add Image'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
