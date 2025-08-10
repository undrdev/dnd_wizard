import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  TrashIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { LocationCard } from './LocationCard';
import { LocationModal } from './LocationModal';
import { ImageGallery } from './ImageGallery';
import { useLocations } from '@/hooks/useLocations';
import type { EnhancedLocation, LocationFilterCriteria, LocationSortBy } from '@/types';

interface LocationListProps {
  showCreateButton?: boolean;
  showBulkActions?: boolean;
  initialCoords?: { lat: number; lng: number };
}

export function LocationList({ 
  showCreateButton = true, 
  showBulkActions = true,
  initialCoords 
}: LocationListProps) {
  const {
    filteredLocations,
    searchTerm,
    setSearchTerm,
    filterCriteria,
    setFilterCriteria,
    sortBy,
    setSortBy,
    sortAscending,
    setSortAscending,
    deleteLocation,
    bulkDeleteLocations,
    clearFilters,
  } = useLocations();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<EnhancedLocation | null>(null);
  const [viewingImages, setViewingImages] = useState<EnhancedLocation | null>(null);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const handleSelectLocation = (locationId: string, selected: boolean) => {
    if (selected) {
      setSelectedLocationIds(prev => [...prev, locationId]);
    } else {
      setSelectedLocationIds(prev => prev.filter(id => id !== locationId));
    }
  };

  const handleSelectAll = () => {
    if (selectedLocationIds.length === filteredLocations.length) {
      setSelectedLocationIds([]);
    } else {
      setSelectedLocationIds(filteredLocations.map(loc => loc.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLocationIds.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedLocationIds.length} location(s)?`)) {
      const success = await bulkDeleteLocations(selectedLocationIds);
      if (success) {
        setSelectedLocationIds([]);
      }
    }
  };

  const handleDeleteLocation = async (location: EnhancedLocation) => {
    if (confirm(`Are you sure you want to delete "${location.name}"?`)) {
      await deleteLocation(location.id);
    }
  };

  const handleFilterChange = (field: keyof LocationFilterCriteria, value: any) => {
    setFilterCriteria(prev => ({ ...prev, [field]: value }));
  };

  const clearAllFilters = () => {
    clearFilters();
    setShowFilters(false);
  };

  const hasActiveFilters = Object.keys(filterCriteria).some(key => {
    const value = filterCriteria[key as keyof LocationFilterCriteria];
    return value !== undefined && value !== null && 
           (Array.isArray(value) ? value.length > 0 : true);
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Locations ({filteredLocations.length})
          </h2>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {showBulkActions && selectedLocationIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
            >
              <TrashIcon className="h-4 w-4" />
              <span>Delete ({selectedLocationIds.length})</span>
            </button>
          )}
          
          {showCreateButton && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Location</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-1 px-3 py-2 text-sm border rounded-md ${
            showFilters || hasActiveFilters
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="h-4 w-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
              {Object.keys(filterCriteria).filter(key => {
                const value = filterCriteria[key as keyof LocationFilterCriteria];
                return value !== undefined && value !== null && 
                       (Array.isArray(value) ? value.length > 0 : true);
              }).length}
            </span>
          )}
        </button>

        {/* Sort */}
        <div className="flex items-center space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as LocationSortBy)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Name</option>
            <option value="type">Type</option>
            <option value="population">Population</option>
            <option value="createdAt">Created</option>
            <option value="updatedAt">Updated</option>
            <option value="subLocationCount">Sub-locations</option>
          </select>
          
          <button
            onClick={() => setSortAscending(!sortAscending)}
            className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-md"
            title={sortAscending ? 'Sort Descending' : 'Sort Ascending'}
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <div className="space-y-1">
                {['city', 'village', 'landmark', 'dungeon'].map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filterCriteria.type?.includes(type as any) || false}
                      onChange={(e) => {
                        const currentTypes = filterCriteria.type || [];
                        if (e.target.checked) {
                          handleFilterChange('type', [...currentTypes, type]);
                        } else {
                          handleFilterChange('type', currentTypes.filter(t => t !== type));
                        }
                      }}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Population Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Population Range
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filterCriteria.populationRange?.min || ''}
                  onChange={(e) => handleFilterChange('populationRange', {
                    ...filterCriteria.populationRange,
                    min: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filterCriteria.populationRange?.max || ''}
                  onChange={(e) => handleFilterChange('populationRange', {
                    ...filterCriteria.populationRange,
                    max: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Other Filters */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filterCriteria.hasSubLocations || false}
                  onChange={(e) => handleFilterChange('hasSubLocations', e.target.checked || undefined)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Has sub-locations</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filterCriteria.hasImages || false}
                  onChange={(e) => handleFilterChange('hasImages', e.target.checked || undefined)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Has images</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Selection */}
      {showBulkActions && filteredLocations.length > 0 && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={selectedLocationIds.length === filteredLocations.length}
              onChange={handleSelectAll}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Select all</span>
          </label>
          {selectedLocationIds.length > 0 && (
            <span>({selectedLocationIds.length} selected)</span>
          )}
        </div>
      )}

      {/* Location Cards */}
      <div className="space-y-4">
        {filteredLocations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">🗺️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No locations found</h3>
            <p className="text-gray-500">
              {searchTerm || hasActiveFilters 
                ? 'Try adjusting your search or filters'
                : 'Create your first location to get started'
              }
            </p>
            {showCreateButton && !searchTerm && !hasActiveFilters && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Create Location
              </button>
            )}
          </div>
        ) : (
          filteredLocations.map(location => (
            <div key={location.id} className="relative">
              {showBulkActions && (
                <div className="absolute top-4 left-4 z-10">
                  <input
                    type="checkbox"
                    checked={selectedLocationIds.includes(location.id)}
                    onChange={(e) => handleSelectLocation(location.id, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              )}
              <LocationCard
                location={location}
                onEdit={setEditingLocation}
                onDelete={handleDeleteLocation}
                onViewImages={setViewingImages}
              />
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <LocationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialCoords={initialCoords}
      />

      {editingLocation && (
        <LocationModal
          isOpen={true}
          onClose={() => setEditingLocation(null)}
          location={editingLocation}
        />
      )}

      {viewingImages && (
        <ImageGallery
          isOpen={true}
          onClose={() => setViewingImages(null)}
          location={viewingImages}
        />
      )}
    </div>
  );
}
