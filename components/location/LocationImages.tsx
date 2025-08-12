import React, { useState } from 'react';
import { ImageGallery } from '@/components/ui/ImageGallery';
import { imageStorage } from '@/lib/imageStorage';
import { useLocations } from '@/hooks/useLocations';
import type { Location, LocationImage } from '@/types';

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

interface LocationImagesProps {
  location: Location;
  onLocationUpdate?: (location: Location) => void;
  className?: string;
}

export function LocationImages({
  location,
  onLocationUpdate,
  className = '',
}: LocationImagesProps) {
  const { updateImage, removeImage, setPrimaryImage } = useLocations();
  const [isLoading, setIsLoading] = useState(false);

  // Convert LocationImage to ImageGallery format
  const galleryImages = (location as any).images?.map((img: LocationImage) => ({
    id: img.id,
    url: img.url,
    caption: img.caption,
    isPrimary: img.isPrimary,
    metadata: {
      name: `location_image_${img.id}`,
      size: 0, // We don't store size for existing images
      timeCreated: img.uploadedAt.toISOString(),
    },
  })) || [];

  const handleImagesChange = (images: ImageItem[]) => {
    // Convert back to LocationImage format
    const locationImages: LocationImage[] = images.map(img => ({
      id: img.id,
      url: img.url,
      caption: img.caption || '',
      isPrimary: img.isPrimary || false,
      uploadedAt: new Date(img.metadata?.timeCreated || Date.now()),
    }));

    const updatedLocation = {
      ...location,
      images: locationImages,
    };

    onLocationUpdate?.(updatedLocation);
  };

  const handleImageDelete = async (imageId: string) => {
    setIsLoading(true);
    try {
      // Find the image to get its storage path
      const image = galleryImages.find((img: any) => img.id === imageId);
      if (image) {
        // Extract path from URL (this is a simplified approach)
        // In a real implementation, you'd store the path with the image
        const urlParts = image.url.split('/');
        const fileName = urlParts[urlParts.length - 1].split('?')[0];
        const path = `campaigns/${location.campaignId}/locations/${fileName}`;
        
        try {
          await imageStorage.deleteImage(path);
        } catch (error) {
          console.warn('Could not delete from storage:', error);
          // Continue with database deletion even if storage deletion fails
        }
      }

      await removeImage(location.id, imageId);
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpdate = async (imageId: string, updates: any) => {
    setIsLoading(true);
    try {
      await updateImage(location.id, imageId, updates);
    } catch (error) {
      console.error('Error updating image:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    setIsLoading(true);
    try {
      await setPrimaryImage(location.id, imageId);
    } catch (error) {
      console.error('Error setting primary image:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <ImageGallery
        images={galleryImages}
        entityType="location"
        entityId={location.campaignId} // Use campaignId for storage organization
        onImagesChange={handleImagesChange}
        onImageDelete={handleImageDelete}
        onImageUpdate={handleImageUpdate}
        onSetPrimary={handleSetPrimary}
        maxImages={20}
        allowUpload={true}
        allowEdit={true}
        allowDelete={true}
        showCaptions={true}
      />
      
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span>Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}
