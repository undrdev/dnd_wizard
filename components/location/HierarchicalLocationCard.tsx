import React from 'react';
import { 
  ChevronRightIcon, 
  ChevronDownIcon,
  UsersIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  HomeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { EnhancedLocation, NPC, LocationType } from '@/types';

interface HierarchicalLocationCardProps {
  location: EnhancedLocation;
  npcs: NPC[];
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpanded: () => void;
  onNavigate: () => void;
  onSelect: () => void;
}

const getLocationIcon = (type: LocationType) => {
  switch (type) {
    case 'continent':
    case 'region':
      return GlobeAltIcon;
    case 'country':
    case 'kingdom':
    case 'province':
    case 'state':
      return MapPinIcon;
    case 'city':
    case 'town':
    case 'village':
      return BuildingOfficeIcon;
    case 'district':
    case 'neighborhood':
    case 'building':
    case 'establishment':
      return HomeIcon;
    default:
      return MapPinIcon;
  }
};

const getLocationTypeColor = (type: LocationType): string => {
  switch (type) {
    case 'continent':
    case 'region':
      return 'bg-purple-100 text-purple-800';
    case 'country':
    case 'kingdom':
      return 'bg-blue-100 text-blue-800';
    case 'province':
    case 'state':
      return 'bg-indigo-100 text-indigo-800';
    case 'city':
      return 'bg-green-100 text-green-800';
    case 'town':
      return 'bg-yellow-100 text-yellow-800';
    case 'village':
      return 'bg-orange-100 text-orange-800';
    case 'district':
    case 'neighborhood':
      return 'bg-gray-100 text-gray-800';
    case 'building':
    case 'establishment':
      return 'bg-red-100 text-red-800';
    case 'temple':
    case 'ruins':
    case 'monument':
      return 'bg-amber-100 text-amber-800';
    case 'river':
    case 'lake':
    case 'ocean':
      return 'bg-cyan-100 text-cyan-800';
    case 'mountain':
    case 'forest':
    case 'desert':
      return 'bg-emerald-100 text-emerald-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getSizeDescription = (size: string): string => {
  switch (size) {
    case 'tiny': return 'Tiny';
    case 'small': return 'Small';
    case 'medium': return 'Medium';
    case 'large': return 'Large';
    case 'huge': return 'Huge';
    case 'massive': return 'Massive';
    default: return 'Unknown';
  }
};

export function HierarchicalLocationCard({ 
  location, 
  npcs, 
  isExpanded, 
  isSelected,
  onToggleExpanded, 
  onNavigate, 
  onSelect 
}: HierarchicalLocationCardProps) {
  const LocationIcon = getLocationIcon(location.type);
  const hasSubLocations = location.subLocations.length > 0;
  const npcCount = npcs.length;

  return (
    <div 
      className={`border rounded-lg transition-all duration-200 cursor-pointer ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
      onClick={onSelect}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className={`p-2 rounded-lg ${getLocationTypeColor(location.type)}`}>
              <LocationIcon className="h-5 w-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {location.name}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLocationTypeColor(location.type)}`}>
                  {location.type.charAt(0).toUpperCase() + location.type.slice(1)}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {location.description}
              </p>

              {/* Metadata */}
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                {location.population !== undefined && location.population > 0 && (
                  <span>Pop: {location.population.toLocaleString()}</span>
                )}
                <span>Size: {getSizeDescription(location.size)}</span>
                {location.hierarchyLevel !== undefined && (
                  <span>Level: {location.hierarchyLevel}</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            {hasSubLocations && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpanded();
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                )}
              </button>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate();
              }}
              className="p-1 hover:bg-blue-100 rounded transition-colors text-blue-600"
              title="Navigate to location"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            {hasSubLocations && (
              <span className="flex items-center space-x-1">
                <MapPinIcon className="h-4 w-4" />
                <span>{location.subLocations.length} sub-location{location.subLocations.length !== 1 ? 's' : ''}</span>
              </span>
            )}
            
            {npcCount > 0 && (
              <span className="flex items-center space-x-1">
                <UsersIcon className="h-4 w-4" />
                <span>{npcCount} NPC{npcCount !== 1 ? 's' : ''}</span>
              </span>
            )}
          </div>

          {/* Notable Features */}
          {location.notableFeatures && location.notableFeatures.length > 0 && (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-amber-600 font-medium">
                ✨ {location.notableFeatures.length} notable feature{location.notableFeatures.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            {/* Geography */}
            {location.geography && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Geography</h4>
                <p className="text-xs text-gray-600">
                  {location.geography.terrain} • {location.geography.climateZone}
                </p>
                {location.geography.naturalFeatures.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Features: {location.geography.naturalFeatures.slice(0, 3).join(', ')}
                    {location.geography.naturalFeatures.length > 3 && '...'}
                  </p>
                )}
              </div>
            )}

            {/* Politics */}
            {location.politics && location.politics.governmentType && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Politics</h4>
                <p className="text-xs text-gray-600">
                  {location.politics.governmentType}
                  {location.politics.rulers.length > 0 && ` • Ruled by ${location.politics.rulers[0]}`}
                </p>
              </div>
            )}

            {/* Economy */}
            {location.economy && location.economy.economicStatus && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Economy</h4>
                <p className="text-xs text-gray-600">
                  {location.economy.economicStatus}
                  {location.economy.tradeGoods.length > 0 && ` • Known for ${location.economy.tradeGoods.slice(0, 2).join(', ')}`}
                </p>
              </div>
            )}

            {/* NPCs Preview */}
            {npcCount > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Notable NPCs</h4>
                <div className="flex flex-wrap gap-1">
                  {npcs.slice(0, 3).map(npc => (
                    <span 
                      key={npc.id}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {npc.name}
                    </span>
                  ))}
                  {npcCount > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{npcCount - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
