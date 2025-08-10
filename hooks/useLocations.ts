import { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { LocationService } from '@/lib/firestore';
import type { 
  EnhancedLocation, 
  LocationImage, 
  LocationFilterCriteria,
  LocationSortBy,
  LocationHierarchyNode,
  CreateEnhancedLocationData,
} from '@/types';
import {
  enhanceLocation,
  validateLocationData,
  filterLocationsBySearch,
  filterLocationsByCriteria,
  sortLocations,
  buildLocationHierarchy,
  createLocationImage,
  getLocationBreadcrumb,
  getDescendantLocations,
  canMoveLocation,
} from '@/lib/locationUtils';

export interface UseLocationsReturn {
  // Data
  locations: EnhancedLocation[];
  filteredLocations: EnhancedLocation[];
  selectedLocation: EnhancedLocation | undefined;
  locationHierarchy: LocationHierarchyNode[];
  
  // Search and filter state
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterCriteria: LocationFilterCriteria;
  setFilterCriteria: (criteria: LocationFilterCriteria) => void;
  sortBy: LocationSortBy;
  setSortBy: (sortBy: LocationSortBy) => void;
  sortAscending: boolean;
  setSortAscending: (ascending: boolean) => void;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Actions
  createLocation: (data: CreateEnhancedLocationData) => Promise<boolean>;
  updateLocation: (locationId: string, updates: Partial<EnhancedLocation>) => Promise<boolean>;
  deleteLocation: (locationId: string) => Promise<boolean>;
  bulkDeleteLocations: (locationIds: string[]) => Promise<boolean>;
  
  // Image actions
  addImage: (locationId: string, image: LocationImage) => Promise<boolean>;
  updateImage: (locationId: string, imageId: string, updates: Partial<LocationImage>) => Promise<boolean>;
  removeImage: (locationId: string, imageId: string) => Promise<boolean>;
  setPrimaryImage: (locationId: string, imageId: string) => Promise<boolean>;
  
  // Hierarchy actions
  moveLocation: (locationId: string, newParentId?: string) => Promise<boolean>;
  
  // Utility functions
  getLocationsByParent: (parentId?: string) => EnhancedLocation[];
  getLocationBreadcrumbPath: (locationId: string) => EnhancedLocation[];
  getSubLocations: (locationId: string) => EnhancedLocation[];
  clearFilters: () => void;
  refreshLocations: () => Promise<void>;
}

export function useLocations(): UseLocationsReturn {
  const {
    locations: storeLocations,
    currentCampaign,
    addLocation,
    updateLocation: updateStoreLocation,
    deleteLocation: deleteStoreLocation,
    getSelectedLocation,
    setLoading,
    setError,
  } = useAppStore();

  // Local state for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCriteria, setFilterCriteria] = useState<LocationFilterCriteria>({});
  const [sortBy, setSortBy] = useState<LocationSortBy>('name');
  const [sortAscending, setSortAscending] = useState(true);
  
  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Enhanced locations for current campaign
  const locations = useMemo(() => {
    if (!currentCampaign) return [];
    return storeLocations
      .filter(location => location.campaignId === currentCampaign.id)
      .map(enhanceLocation);
  }, [storeLocations, currentCampaign]);

  // Filtered and sorted locations
  const filteredLocations = useMemo(() => {
    let filtered = filterLocationsBySearch(locations, searchTerm);
    filtered = filterLocationsByCriteria(filtered, filterCriteria);
    return sortLocations(filtered, sortBy, sortAscending);
  }, [locations, searchTerm, filterCriteria, sortBy, sortAscending]);

  // Selected location
  const selectedLocation = useMemo(() => {
    const selected = getSelectedLocation();
    return selected ? enhanceLocation(selected) : undefined;
  }, [getSelectedLocation]);

  // Location hierarchy
  const locationHierarchy = useMemo(() => {
    return buildLocationHierarchy(locations);
  }, [locations]);

  // Create location
  const createLocation = useCallback(async (data: CreateEnhancedLocationData): Promise<boolean> => {
    if (!currentCampaign) {
      setError('No active campaign');
      return false;
    }

    const validation = validateLocationData(data);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setIsCreating(true);
    try {
      const locationData = {
        ...data,
        campaignId: currentCampaign.id,
        npcs: [],
        quests: [],
      };

      const locationId = await LocationService.createLocation(locationData);
      const newLocation = { ...locationData, id: locationId };
      addLocation(newLocation);

      // Update parent location's subLocations if applicable
      if (data.parentLocationId) {
        const parentLocation = locations.find(loc => loc.id === data.parentLocationId);
        if (parentLocation) {
          const updatedSubLocations = [...parentLocation.subLocations, locationId];
          try {
            await LocationService.updateLocation(data.parentLocationId, { subLocations: updatedSubLocations } as any);
            updateStoreLocation(data.parentLocationId, { subLocations: updatedSubLocations } as any);
          } catch (error) {
            console.error('Error updating parent location:', error);
            // Don't fail the creation if parent update fails
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error creating location:', error);
      setError('Failed to create location');
      return false;
    } finally {
      setIsCreating(false);
    }
  }, [currentCampaign, addLocation, setError, locations, updateStoreLocation]);

  // Update location
  const updateLocation = useCallback(async (
    locationId: string, 
    updates: Partial<EnhancedLocation>
  ): Promise<boolean> => {
    const validation = validateLocationData(updates);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setIsUpdating(true);
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await LocationService.updateLocation(locationId, updateData);
      updateStoreLocation(locationId, updateData);
      return true;
    } catch (error) {
      console.error('Error updating location:', error);
      setError('Failed to update location');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [updateStoreLocation, setError]);

  // Delete location
  const deleteLocation = useCallback(async (locationId: string): Promise<boolean> => {
    const location = locations.find(loc => loc.id === locationId);
    if (!location) {
      setError('Location not found');
      return false;
    }

    // Check if location has sub-locations
    if (location.subLocations.length > 0) {
      setError('Cannot delete location with sub-locations. Move or delete sub-locations first.');
      return false;
    }

    setIsDeleting(true);
    try {
      await LocationService.deleteLocation(locationId);
      deleteStoreLocation(locationId);

      // Remove from parent's subLocations if applicable
      if (location.parentLocationId) {
        const parentLocation = locations.find(loc => loc.id === location.parentLocationId);
        if (parentLocation) {
          const updatedSubLocations = parentLocation.subLocations.filter(id => id !== locationId);
          try {
            await LocationService.updateLocation(location.parentLocationId, { subLocations: updatedSubLocations } as any);
            updateStoreLocation(location.parentLocationId, { subLocations: updatedSubLocations } as any);
          } catch (error) {
            console.error('Error updating parent location:', error);
            // Don't fail the deletion if parent update fails
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error deleting location:', error);
      setError('Failed to delete location');
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [locations, deleteStoreLocation, setError, updateStoreLocation]);

  // Bulk delete locations
  const bulkDeleteLocations = useCallback(async (locationIds: string[]): Promise<boolean> => {
    setIsDeleting(true);
    try {
      const deletePromises = locationIds.map(id => deleteLocation(id));
      const results = await Promise.all(deletePromises);
      return results.every(result => result);
    } catch (error) {
      console.error('Error bulk deleting locations:', error);
      setError('Failed to delete some locations');
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [deleteLocation, setError]);

  // Add image to location
  const addImage = useCallback(async (
    locationId: string,
    image: LocationImage
  ): Promise<boolean> => {
    const location = locations.find(loc => loc.id === locationId);
    if (!location) {
      setError('Location not found');
      return false;
    }

    const updatedImages = [...location.images, image];

    try {
      await LocationService.updateLocation(locationId, { images: updatedImages } as any);
      updateStoreLocation(locationId, { images: updatedImages } as any);
      return true;
    } catch (error) {
      console.error('Error adding image:', error);
      setError('Failed to add image');
      return false;
    }
  }, [locations, setError, updateStoreLocation]);

  // Update image
  const updateImage = useCallback(async (
    locationId: string,
    imageId: string,
    updates: Partial<LocationImage>
  ): Promise<boolean> => {
    const location = locations.find(loc => loc.id === locationId);
    if (!location) {
      setError('Location not found');
      return false;
    }

    const updatedImages = location.images.map(img =>
      img.id === imageId ? { ...img, ...updates } : img
    );

    try {
      await LocationService.updateLocation(locationId, { images: updatedImages } as any);
      updateStoreLocation(locationId, { images: updatedImages } as any);
      return true;
    } catch (error) {
      console.error('Error updating image:', error);
      setError('Failed to update image');
      return false;
    }
  }, [locations, setError, updateStoreLocation]);

  // Remove image
  const removeImage = useCallback(async (
    locationId: string,
    imageId: string
  ): Promise<boolean> => {
    const location = locations.find(loc => loc.id === locationId);
    if (!location) {
      setError('Location not found');
      return false;
    }

    const updatedImages = location.images.filter(img => img.id !== imageId);

    try {
      await LocationService.updateLocation(locationId, { images: updatedImages } as any);
      updateStoreLocation(locationId, { images: updatedImages } as any);
      return true;
    } catch (error) {
      console.error('Error removing image:', error);
      setError('Failed to remove image');
      return false;
    }
  }, [locations, setError, updateStoreLocation]);

  // Set primary image
  const setPrimaryImage = useCallback(async (
    locationId: string,
    imageId: string
  ): Promise<boolean> => {
    const location = locations.find(loc => loc.id === locationId);
    if (!location) {
      setError('Location not found');
      return false;
    }

    const updatedImages = location.images.map(img => ({
      ...img,
      isPrimary: img.id === imageId,
    }));

    try {
      await LocationService.updateLocation(locationId, { images: updatedImages } as any);
      updateStoreLocation(locationId, { images: updatedImages } as any);
      return true;
    } catch (error) {
      console.error('Error setting primary image:', error);
      setError('Failed to set primary image');
      return false;
    }
  }, [locations, setError, updateStoreLocation]);

  // Move location in hierarchy
  const moveLocation = useCallback(async (
    locationId: string,
    newParentId?: string
  ): Promise<boolean> => {
    const location = locations.find(loc => loc.id === locationId);
    if (!location) {
      setError('Location not found');
      return false;
    }

    // Validate move
    if (newParentId && !canMoveLocation(locationId, newParentId, locations)) {
      setError('Cannot move location: would create circular reference');
      return false;
    }

    try {
      // Remove from old parent
      if (location.parentLocationId) {
        const oldParent = locations.find(loc => loc.id === location.parentLocationId);
        if (oldParent) {
          const updatedSubLocations = oldParent.subLocations.filter(id => id !== locationId);
          await LocationService.updateLocation(location.parentLocationId, { subLocations: updatedSubLocations } as any);
          updateStoreLocation(location.parentLocationId, { subLocations: updatedSubLocations } as any);
        }
      }

      // Add to new parent
      if (newParentId) {
        const newParent = locations.find(loc => loc.id === newParentId);
        if (newParent) {
          const updatedSubLocations = [...newParent.subLocations, locationId];
          await LocationService.updateLocation(newParentId, { subLocations: updatedSubLocations } as any);
          updateStoreLocation(newParentId, { subLocations: updatedSubLocations } as any);
        }
      }

      // Update location's parent
      await LocationService.updateLocation(locationId, { parentLocationId: newParentId } as any);
      updateStoreLocation(locationId, { parentLocationId: newParentId } as any);
      return true;
    } catch (error) {
      console.error('Error moving location:', error);
      setError('Failed to move location');
      return false;
    }
  }, [locations, setError, updateStoreLocation]);

  // Get locations by parent
  const getLocationsByParent = useCallback((parentId?: string): EnhancedLocation[] => {
    return locations.filter(location => location.parentLocationId === parentId);
  }, [locations]);

  // Get location breadcrumb path
  const getLocationBreadcrumbPath = useCallback((locationId: string): EnhancedLocation[] => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? getLocationBreadcrumb(location, locations) : [];
  }, [locations]);

  // Get sub-locations
  const getSubLocations = useCallback((locationId: string): EnhancedLocation[] => {
    const location = locations.find(loc => loc.id === locationId);
    if (!location) return [];
    
    return location.subLocations
      .map(subId => locations.find(loc => loc.id === subId))
      .filter(Boolean) as EnhancedLocation[];
  }, [locations]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterCriteria({});
    setSortBy('name');
    setSortAscending(true);
  }, []);

  // Refresh locations
  const refreshLocations = useCallback(async () => {
    if (!currentCampaign) return;
    
    try {
      setLoading(true);
      const campaignLocations = await LocationService.getCampaignLocations(currentCampaign.id);
      // This would typically update the store, but we're using the existing store pattern
    } catch (error) {
      console.error('Error refreshing locations:', error);
      setError('Failed to refresh locations');
    } finally {
      setLoading(false);
    }
  }, [currentCampaign, setLoading, setError]);

  return {
    // Data
    locations,
    filteredLocations,
    selectedLocation,
    locationHierarchy,
    
    // Search and filter state
    searchTerm,
    setSearchTerm,
    filterCriteria,
    setFilterCriteria,
    sortBy,
    setSortBy,
    sortAscending,
    setSortAscending,
    
    // Loading states
    isLoading: false, // This would come from the store
    isCreating,
    isUpdating,
    isDeleting,
    
    // Actions
    createLocation,
    updateLocation,
    deleteLocation,
    bulkDeleteLocations,
    
    // Image actions
    addImage,
    updateImage,
    removeImage,
    setPrimaryImage,
    
    // Hierarchy actions
    moveLocation,
    
    // Utility functions
    getLocationsByParent,
    getLocationBreadcrumbPath,
    getSubLocations,
    clearFilters,
    refreshLocations,
  };
}
