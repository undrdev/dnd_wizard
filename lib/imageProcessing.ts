import imageCompression from 'browser-image-compression';

export interface ImageProcessingOptions {
  resize?: { width: number; height: number };
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
}

export interface CropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Process an image file with various transformations
 */
export async function processImage(
  file: File,
  options: ImageProcessingOptions
): Promise<File> {
  const {
    resize,
    quality = 0.8,
    format,
    maintainAspectRatio = true,
  } = options;

  try {
    // Create compression options
    const compressionOptions: any = {
      maxSizeMB: 5,
      maxWidthOrHeight: resize ? Math.max(resize.width, resize.height) : 1920,
      useWebWorker: true,
      fileType: format ? `image/${format}` : file.type,
      initialQuality: quality,
    };

    // If specific dimensions are requested
    if (resize) {
      compressionOptions.maxWidthOrHeight = Math.max(resize.width, resize.height);
      
      // If we need exact dimensions (not maintaining aspect ratio)
      if (!maintainAspectRatio) {
        return await resizeToExactDimensions(file, resize, quality, format);
      }
    }

    const compressedFile = await imageCompression(file, compressionOptions);
    
    // Rename file if format changed
    if (format && !file.name.endsWith(`.${format}`)) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      return new File([compressedFile], `${nameWithoutExt}.${format}`, {
        type: `image/${format}`,
      });
    }

    return compressedFile;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error(`Image processing failed: ${error}`);
  }
}

/**
 * Resize image to exact dimensions using canvas
 */
async function resizeToExactDimensions(
  file: File,
  dimensions: { width: number; height: number },
  quality: number = 0.8,
  format?: string
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      // Draw image with exact dimensions
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

      // Convert to blob
      const outputFormat = format ? `image/${format}` : file.type;
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }

          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          const extension = format || file.type.split('/')[1];
          const processedFile = new File([blob], `${nameWithoutExt}.${extension}`, {
            type: outputFormat,
          });

          resolve(processedFile);
        },
        outputFormat,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Crop an image using canvas
 */
export async function cropImage(
  file: File,
  cropOptions: CropOptions,
  outputFormat?: string
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      canvas.width = cropOptions.width;
      canvas.height = cropOptions.height;

      // Draw cropped portion
      ctx.drawImage(
        img,
        cropOptions.x,
        cropOptions.y,
        cropOptions.width,
        cropOptions.height,
        0,
        0,
        cropOptions.width,
        cropOptions.height
      );

      // Convert to blob
      const format = outputFormat || file.type;
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }

          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          const extension = format.split('/')[1];
          const croppedFile = new File([blob], `${nameWithoutExt}_cropped.${extension}`, {
            type: format,
          });

          resolve(croppedFile);
        },
        format,
        0.9
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get image dimensions
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert image to different format
 */
export async function convertImageFormat(
  file: File,
  targetFormat: 'jpeg' | 'png' | 'webp',
  quality: number = 0.9
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Handle transparency for JPEG
      if (targetFormat === 'jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      // Convert to target format
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }

          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          const convertedFile = new File([blob], `${nameWithoutExt}.${targetFormat}`, {
            type: `image/${targetFormat}`,
          });

          resolve(convertedFile);
        },
        `image/${targetFormat}`,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate a thumbnail from an image file
 */
export async function generateThumbnail(
  file: File,
  size: { width: number; height: number } = { width: 150, height: 150 },
  quality: number = 0.8
): Promise<File> {
  return processImage(file, {
    resize: size,
    quality,
    format: 'jpeg',
    maintainAspectRatio: false,
  });
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check if it's actually an image
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File is not an image' };
  }

  // Check supported formats
  const supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!supportedFormats.includes(file.type)) {
    return { valid: false, error: 'Unsupported image format' };
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'Image file is too large (max 5MB)' };
  }

  // Check file name
  if (!file.name || file.name.length > 100) {
    return { valid: false, error: 'Invalid file name' };
  }

  return { valid: true };
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
export function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let newWidth = maxWidth;
  let newHeight = maxWidth / aspectRatio;

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = maxHeight * aspectRatio;
  }

  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight),
  };
}

/**
 * Create a preview URL for an image file
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Clean up preview URL
 */
export function cleanupImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}
