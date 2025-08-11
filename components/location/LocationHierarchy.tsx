import React, { useState } from 'react';
import { 
  ChevronRightIcon,
  ChevronDownIcon,
  MapPinIcon,
  PlusIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { HierarchicalLocationCard } from './HierarchicalLocationCard';
import { LocationModal } from './LocationModal';
import { ImageGallery } from './ImageGallery';
import { useLocations } from '@/hooks/useLocations';
import { useAppStore } from '@/stores/useAppStore';
import type { EnhancedLocation, LocationHierarchyNode } from '@/types';

interface LocationHierarchyProps {
  showCreateButton?: boolean;
  onLocationSelect?: (location: EnhancedLocation) => void;
}

export function LocationHierarchy({ 
  showCreateButton = true,
  onLocationSelect 
}: LocationHierarchyProps) {
  const { selectLocation } = useAppStore();
  const {
    locationHierarchy,
    deleteLocation,
    getLocationBreadcrumbPath,
  } = useLocations();

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<EnhancedLocation | null>(null);
  const [viewingImages, setViewingImages] = useState<EnhancedLocation | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>();

  const toggleExpanded = (locationId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(locationId)) {
      newExpanded.delete(locationId);
    } else {
      newExpanded.add(locationId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleLocationClick = (location: EnhancedLocation) => {
    selectLocation(location.id);
    onLocationSelect?.(location);
  };

  const handleDeleteLocation = async (location: EnhancedLocation) => {
    if (confirm(`Are you sure you want to delete "${location.name}"?`)) {
      await deleteLocation(location.id);
    }
  };

  const handleCreateSubLocation = (parentLocation: EnhancedLocation) => {
    setSelectedParentId(parentLocation.id);
    setIsCreateModalOpen(true);
  };

  const renderBreadcrumb = (location: EnhancedLocation) => {
    const breadcrumb = getLocationBreadcrumbPath(location.id);
    
    return (
      <div className="flex items-center space-x-1 text-xs text-gray-500 mb-2">
        {breadcrumb.map((ancestor, index) => (
          <React.Fragment key={ancestor.id}>
            {index > 0 && <ArrowRightIcon className="h-3 w-3" />}
            <button
              onClick={() => handleLocationClick(ancestor)}
              className="hover:text-blue-600"
            >
              {ancestor.name}
            </button>
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderLocationNode = (node: LocationHierarchyNode) => {
    const { location, children, depth } = node;
    const isExpanded = expandedNodes.has(location.id);
    const hasChildren = children.length > 0;

    const typeIcons: Record<string, string> = {
      continent: '🌍',
      region: '🗺️',
      country: '🏛️',
      kingdom: '👑',
      province: '🏞️',
      state: '🏛️',
      city: '🏰',
      town: '🏘️',
      village: '🏡',
      district: '🏢',
      neighborhood: '🏠',
      building: '🏗️',
      establishment: '🏪',
      river: '🌊',
      lake: '🏞️',
      ocean: '🌊',
      mountain: '⛰️',
      forest: '🌲',
      desert: '🏜️',
      temple: '⛪',
      ruins: '🏛️',
      monument: '🗿',
      bridge: '🌉',
      crossroads: '🛤️',
      dungeon: '🕳️',
      wilderness: '🌿',
      structure: '🏗️',
      landmark: '🗿',
    };

    const typeColors: Record<string, string> = {
      continent: 'bg-purple-100 text-purple-800 border-purple-200',
      region: 'bg-purple-100 text-purple-800 border-purple-200',
      country: 'bg-blue-100 text-blue-800 border-blue-200',
      kingdom: 'bg-blue-100 text-blue-800 border-blue-200',
      province: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      state: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      city: 'bg-green-100 text-green-800 border-green-200',
      town: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      village: 'bg-orange-100 text-orange-800 border-orange-200',
      district: 'bg-gray-100 text-gray-800 border-gray-200',
      neighborhood: 'bg-gray-100 text-gray-800 border-gray-200',
      building: 'bg-red-100 text-red-800 border-red-200',
      establishment: 'bg-red-100 text-red-800 border-red-200',
      river: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      lake: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      ocean: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      mountain: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      forest: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      desert: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      temple: 'bg-amber-100 text-amber-800 border-amber-200',
      ruins: 'bg-amber-100 text-amber-800 border-amber-200',
      monument: 'bg-amber-100 text-amber-800 border-amber-200',
      bridge: 'bg-amber-100 text-amber-800 border-amber-200',
      crossroads: 'bg-amber-100 text-amber-800 border-amber-200',
      dungeon: 'bg-red-100 text-red-800 border-red-200',
      wilderness: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      structure: 'bg-red-100 text-red-800 border-red-200',
      landmark: 'bg-blue-100 text-blue-800 border-blue-200',
    };

    return (
      <div key={location.id} className="relative">
        {/* Connection Lines */}
        {depth > 0 && (
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200"></div>
        )}
        
        <div className={`relative ${depth > 0 ? 'ml-8' : ''}`}>
          {/* Horizontal line for non-root nodes */}
          {depth > 0 && (
            <div className="absolute left-0 top-6 w-4 h-px bg-gray-200"></div>
          )}
          
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleExpanded(location.id)}
                    className={`flex-shrink-0 p-1 rounded ${
                      hasChildren 
                        ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100' 
                        : 'text-gray-300 cursor-default'
                    }`}
                    disabled={!hasChildren}
                  >
                    {hasChildren ? (
                      isExpanded ? (
                        <ChevronDownIcon className="h-4 w-4" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )
                    ) : (
                      <div className="h-4 w-4"></div>
                    )}
                  </button>

                  {/* Location Info */}
                  <div 
                    className="flex items-center space-x-3 flex-1 cursor-pointer"
                    onClick={() => handleLocationClick(location)}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                        {typeIcons[location.type]}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {location.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${typeColors[location.type]}`}>
                          {location.type}
                        </span>
                      </div>
                      
                      {location.description && (
                        <p className="text-xs text-gray-600 line-clamp-1">
                          {location.description}
                        </p>
                      )}

                      {/* Quick Stats */}
                      <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                        {location.population && (
                          <span>{location.population.toLocaleString()} people</span>
                        )}
                        {children.length > 0 && (
                          <span>{children.length} sub-location{children.length !== 1 ? 's' : ''}</span>
                        )}
                        {location.images.length > 0 && (
                          <span>{location.images.length} image{location.images.length !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={() => handleCreateSubLocation(location)}
                    className="p-1 text-gray-400 hover:text-green-600 rounded"
                    title="Add Sub-location"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => setEditingLocation(location)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                    title="Edit Location"
                  >
                    <MapPinIcon className="h-4 w-4" />
                  </button>
                  
                  {location.images.length > 0 && (
                    <button
                      onClick={() => setViewingImages(location)}
                      className="p-1 text-gray-400 hover:text-purple-600 rounded"
                      title="View Images"
                    >
                      📷
                    </button>
                  )}
                </div>
              </div>

              {/* Breadcrumb for deeper nodes */}
              {depth > 1 && renderBreadcrumb(location)}
            </div>
          </div>

          {/* Children */}
          {isExpanded && children.length > 0 && (
            <div className="mt-2 space-y-2">
              {children.map(childNode => renderLocationNode(childNode))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-gray-900">Location Hierarchy</h2>
          <span className="text-sm text-gray-500">
            ({locationHierarchy.length} root location{locationHierarchy.length !== 1 ? 's' : ''})
          </span>
        </div>
        
        {showCreateButton && (
          <button
            onClick={() => {
              setSelectedParentId(undefined);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Root Location</span>
          </button>
        )}
      </div>

      {/* Hierarchy Tree */}
      <div className="space-y-4">
        {locationHierarchy.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">🌳</div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No locations found</h3>
            <p className="text-gray-500 mb-4">
              Create your first location to start building your world hierarchy
            </p>
            {showCreateButton && (
              <button
                onClick={() => {
                  setSelectedParentId(undefined);
                  setIsCreateModalOpen(true);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Create Root Location
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {locationHierarchy.map(node => renderLocationNode(node))}
          </div>
        )}
      </div>

      {/* Hierarchy Controls */}
      {locationHierarchy.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                const allLocationIds = new Set<string>();
                const collectIds = (nodes: LocationHierarchyNode[]) => {
                  nodes.forEach(node => {
                    allLocationIds.add(node.location.id);
                    collectIds(node.children);
                  });
                };
                collectIds(locationHierarchy);
                setExpandedNodes(allLocationIds);
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Expand All
            </button>
            
            <button
              onClick={() => setExpandedNodes(new Set())}
              className="text-blue-600 hover:text-blue-800"
            >
              Collapse All
            </button>
          </div>
          
          <div className="text-xs text-gray-500">
            Click locations to select • Use + to add sub-locations
          </div>
        </div>
      )}

      {/* Modals */}
      <LocationModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedParentId(undefined);
        }}
        parentLocationId={selectedParentId}
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
