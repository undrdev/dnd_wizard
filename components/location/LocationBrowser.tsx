import React, { useState, useMemo } from 'react';
import { 
  ChevronRightIcon, 
  ChevronDownIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UsersIcon,
  MapPinIcon,
  QuestionMarkCircleIcon,
  XMarkIcon
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
  const [showHelp, setShowHelp] = useState(false);

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
    <div className={`h-full flex flex-col bg-white ${className}`}>
      {/* Help Section */}
      {showHelp && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900 mb-2">How to Use the Location Browser</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Left Panel:</strong> Browse locations in a hierarchical tree structure. Click on any location to view its details.</p>
                <p><strong>Right Panel:</strong> View detailed information about the selected location, including NPCs and sub-locations.</p>
                <p><strong>Search:</strong> Use the search bar to quickly find locations by name.</p>
                <p><strong>Filter:</strong> Filter locations by type (City, Village, Landmark, Dungeon).</p>
                <p><strong>Navigation:</strong> Use breadcrumbs to navigate back to parent locations.</p>
              </div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <MapPinIcon className="h-6 w-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">World Explorer</h2>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-gray-400 hover:text-gray-600"
            title="Show help"
          >
            <QuestionMarkCircleIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter */}
          <select
            value={selectedFilters.length === 0 ? 'all' : selectedFilters[0]}
            onChange={(e) => {
              const newFilters = e.target.value === 'all' ? [] : [e.target.value as LocationType];
              setSelectedFilters(newFilters);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            {locationTypeOptions.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Location Tree */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Location Hierarchy</h3>
            {filteredLocations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPinIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No locations found</p>
                {searchQuery && <p className="text-sm">Try adjusting your search</p>}
              </div>
            ) : (
              <div className="space-y-2">
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
            )}
          </div>
        </div>

        {/* Right Panel - Location Details */}
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
