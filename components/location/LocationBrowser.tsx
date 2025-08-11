import React, { useState, useMemo } from 'react';
import { 
  ChevronRightIcon, 
  ChevronDownIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UsersIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { EnhancedLocation, LocationType, NPC } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { HierarchicalLocationCard } from './HierarchicalLocationCard';
import { LocationDetails } from './LocationDetails';
import { BreadcrumbNavigation } from './BreadcrumbNavigation';

interface LocationBrowserProps {
  className?: string;
}

export function LocationBrowser({ className = '' }: LocationBrowserProps) {
  const { locations, npcs, currentCampaign } = useAppStore();
  const [currentLocationId, setCurrentLocationId] = useState<string | null>(null);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<LocationType[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Get current location
  const currentLocation = currentLocationId
    ? locations.find(loc => loc.id === currentLocationId) || null
    : null;

  // Build location hierarchy
  const locationHierarchy = useMemo(() => {
    const locationMap = new Map(locations.map(loc => [loc.id, loc]));
    const rootLocations: EnhancedLocation[] = [];
    
    locations.forEach(location => {
      if (!location.parentLocationId) {
        rootLocations.push(location);
      }
    });

    const buildHierarchy = (location: EnhancedLocation): any => {
      const children = location.subLocations
        .map(id => locationMap.get(id))
        .filter(Boolean)
        .map(child => buildHierarchy(child!));

      return {
        location,
        children,
        depth: location.hierarchyLevel || 0
      };
    };

    return rootLocations.map(buildHierarchy);
  }, [locations]);

  // Filter locations based on search and filters
  const filteredLocations = useMemo(() => {
    let filtered = currentLocation 
      ? locations.filter(loc => loc.parentLocationId === currentLocation.id)
      : locations.filter(loc => !loc.parentLocationId);

    if (searchQuery) {
      filtered = filtered.filter(loc => 
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedFilters.length > 0) {
      filtered = filtered.filter(loc => selectedFilters.includes(loc.type));
    }

    return filtered.sort((a, b) => {
      // Sort by hierarchy level first, then by name
      if (a.hierarchyLevel !== b.hierarchyLevel) {
        return a.hierarchyLevel - b.hierarchyLevel;
      }
      return a.name.localeCompare(b.name);
    });
  }, [locations, currentLocation, searchQuery, selectedFilters]);

  // Get NPCs in current location and sub-locations
  const locationNPCs = useMemo(() => {
    if (!currentLocation) return [];
    
    const getAllSubLocationIds = (location: EnhancedLocation): string[] => {
      const subIds = [location.id];
      location.subLocations.forEach(subId => {
        const subLocation = locations.find(loc => loc.id === subId);
        if (subLocation) {
          subIds.push(...getAllSubLocationIds(subLocation));
        }
      });
      return subIds;
    };

    const relevantLocationIds = getAllSubLocationIds(currentLocation);
    return npcs.filter(npc => relevantLocationIds.includes(npc.locationId));
  }, [currentLocation, locations, npcs]);

  const toggleExpanded = (locationId: string) => {
    const newExpanded = new Set(expandedLocations);
    if (newExpanded.has(locationId)) {
      newExpanded.delete(locationId);
    } else {
      newExpanded.add(locationId);
    }
    setExpandedLocations(newExpanded);
  };

  const navigateToLocation = (locationId: string) => {
    setCurrentLocationId(locationId);
  };

  const navigateUp = () => {
    if (currentLocation?.parentLocationId) {
      setCurrentLocationId(currentLocation.parentLocationId);
    } else {
      setCurrentLocationId(null);
    }
  };

  const locationTypeOptions: LocationType[] = [
    'continent', 'region', 'country', 'kingdom', 'province', 'state',
    'city', 'town', 'village', 'district', 'neighborhood',
    'building', 'establishment', 'temple', 'ruins', 'monument'
  ];

  return (
    <div className={`h-full flex flex-col bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <MapPinIcon className="h-6 w-6 mr-2 text-blue-600" />
            World Explorer
          </h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <FunnelIcon className="h-4 w-4" />
            <span className="text-sm">Filters</span>
          </button>
        </div>

        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation 
          currentLocation={currentLocation}
          locations={locations}
          onNavigate={navigateToLocation}
          onNavigateHome={() => setCurrentLocationId(null)}
        />

        {/* Search Bar */}
        <div className="relative mt-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Location Types</h3>
            <div className="flex flex-wrap gap-2">
              {locationTypeOptions.map(type => (
                <button
                  key={type}
                  onClick={() => {
                    const newFilters = selectedFilters.includes(type)
                      ? selectedFilters.filter(f => f !== type)
                      : [...selectedFilters, type];
                    setSelectedFilters(newFilters);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedFilters.includes(type)
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            {selectedFilters.length > 0 && (
              <button
                onClick={() => setSelectedFilters([])}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Location List */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            {currentLocation && (
              <button
                onClick={navigateUp}
                className="flex items-center space-x-2 mb-4 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <HomeIcon className="h-4 w-4" />
                <span className="text-sm">Back to {currentLocation.parentLocationId ? 'Parent Location' : 'World View'}</span>
              </button>
            )}

            <div className="space-y-3">
              {filteredLocations.map(location => (
                <HierarchicalLocationCard
                  key={location.id}
                  location={location}
                  npcs={npcs.filter(npc => npc.locationId === location.id)}
                  isExpanded={expandedLocations.has(location.id)}
                  onToggleExpanded={() => toggleExpanded(location.id)}
                  onNavigate={() => navigateToLocation(location.id)}
                  onSelect={() => setCurrentLocationId(location.id)}
                  isSelected={currentLocationId === location.id}
                />
              ))}
            </div>

            {filteredLocations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MapPinIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No locations found</p>
                {searchQuery && (
                  <p className="text-sm mt-2">Try adjusting your search or filters</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Location Details */}
        <div className="w-1/2 overflow-y-auto">
          {currentLocation ? (
            <LocationDetails 
              location={currentLocation}
              npcs={locationNPCs}
              subLocations={filteredLocations}
              onNavigateToSubLocation={navigateToLocation}
            />
          ) : (
            <div className="p-8 text-center text-gray-500">
              <MapPinIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to World Explorer</h3>
              <p>Select a location from the list to view detailed information, NPCs, and sub-locations.</p>
              <div className="mt-6 text-sm text-gray-600">
                <p><strong>{locations.length}</strong> locations in this campaign</p>
                <p><strong>{npcs.length}</strong> NPCs to discover</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
