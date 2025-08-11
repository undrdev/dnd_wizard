import React, { useState } from 'react';
import { 
  MapPinIcon, 
  UsersIcon, 
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PhotoIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CloudIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/useAppStore';
import { useLocations } from '@/hooks/useLocations';
import type { EnhancedLocation } from '@/types';

interface LocationCardProps {
  location: EnhancedLocation;
  onEdit?: (location: EnhancedLocation) => void;
  onDelete?: (location: EnhancedLocation) => void;
  onViewImages?: (location: EnhancedLocation) => void;
  showHierarchy?: boolean;
  depth?: number;
}

export function LocationCard({ 
  location, 
  onEdit,
  onDelete,
  onViewImages,
  showHierarchy = false,
  depth = 0
}: LocationCardProps) {
  const { npcs, quests, selectLocation } = useAppStore();
  const { getSubLocations } = useLocations();
  const [isExpanded, setIsExpanded] = useState(false);

  const locationNPCs = npcs.filter(npc => npc.locationId === location.id);
  const locationQuests = quests.filter(quest => quest.locationIds?.includes(location.id) || false);
  const subLocations = getSubLocations ? getSubLocations(location.id) : [];
  const primaryImage = location.images?.find(img => img.isPrimary);

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
    continent: 'bg-purple-100 text-purple-800',
    region: 'bg-purple-100 text-purple-800',
    country: 'bg-blue-100 text-blue-800',
    kingdom: 'bg-blue-100 text-blue-800',
    province: 'bg-indigo-100 text-indigo-800',
    state: 'bg-indigo-100 text-indigo-800',
    city: 'bg-green-100 text-green-800',
    town: 'bg-yellow-100 text-yellow-800',
    village: 'bg-orange-100 text-orange-800',
    district: 'bg-gray-100 text-gray-800',
    neighborhood: 'bg-gray-100 text-gray-800',
    building: 'bg-red-100 text-red-800',
    establishment: 'bg-red-100 text-red-800',
    river: 'bg-cyan-100 text-cyan-800',
    lake: 'bg-cyan-100 text-cyan-800',
    ocean: 'bg-cyan-100 text-cyan-800',
    mountain: 'bg-emerald-100 text-emerald-800',
    forest: 'bg-emerald-100 text-emerald-800',
    desert: 'bg-emerald-100 text-emerald-800',
    temple: 'bg-amber-100 text-amber-800',
    ruins: 'bg-amber-100 text-amber-800',
    monument: 'bg-amber-100 text-amber-800',
    bridge: 'bg-amber-100 text-amber-800',
    crossroads: 'bg-amber-100 text-amber-800',
    dungeon: 'bg-red-100 text-red-800',
    wilderness: 'bg-emerald-100 text-emerald-800',
    structure: 'bg-red-100 text-red-800',
    landmark: 'bg-blue-100 text-blue-800',
  };

  const handleCardClick = () => {
    if (selectLocation) {
      selectLocation(location.id);
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const indentClass = showHierarchy ? `ml-${Math.min(depth * 4, 16)}` : '';

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow ${indentClass}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 cursor-pointer" onClick={handleCardClick}>
            {/* Location Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                {typeIcons[location.type] || '🗿'}
              </div>
            </div>

            {/* Location Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {location.name}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[location.type] || 'bg-gray-100 text-gray-800'}`}>
                  {location.type}
                </span>
              </div>
              
              {location.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {location.description}
                </p>
              )}

              {/* Quick Stats */}
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                {location.population && location.population > 0 && (
                  <div className="flex items-center space-x-1">
                    <UsersIcon className="h-3 w-3" />
                    <span>{location.population.toLocaleString()}</span>
                  </div>
                )}
                {locationNPCs.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>{locationNPCs.length} NPCs</span>
                  </div>
                )}
                {locationQuests.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span>{locationQuests.length} Quests</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 ml-2">
            {showHierarchy && subLocations.length > 0 && (
              <button
                onClick={handleExpandClick}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </button>
            )}
            
            {location.images && location.images.length > 0 && onViewImages && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewImages(location);
                }}
                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                title="View Images"
              >
                <PhotoIcon className="h-4 w-4" />
              </button>
            )}
            
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(location);
                }}
                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                title="Edit Location"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(location);
                }}
                className="p-1 text-gray-400 hover:text-red-600 rounded"
                title="Delete Location"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Primary Image */}
          {primaryImage && (
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={primaryImage.url}
                alt={primaryImage.caption || location.name}
                className="w-full h-full object-cover"
              />
              {primaryImage.caption && (
                <p className="text-xs text-gray-600 mt-1">{primaryImage.caption}</p>
              )}
            </div>
          )}

          {/* Detailed Description */}
          {location.detailedDescription && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Description</h4>
              <p className="text-sm text-gray-600">{location.detailedDescription}</p>
            </div>
          )}

          {/* NPCs and Quests */}
          {(locationNPCs.length > 0 || locationQuests.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              {/* NPCs */}
              {locationNPCs.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">NPCs ({locationNPCs.length})</h4>
                  <div className="space-y-1">
                    {locationNPCs.slice(0, 3).map(npc => (
                      <div key={npc.id} className="flex items-center space-x-2 text-sm">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-gray-900">{npc.name}</span>
                        <span className="text-gray-500">({npc.role})</span>
                      </div>
                    ))}
                    {locationNPCs.length > 3 && (
                      <p className="text-xs text-gray-500">+{locationNPCs.length - 3} more</p>
                    )}
                  </div>
                </div>
              )}

              {/* Quests */}
              {locationQuests.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Quests ({locationQuests.length})</h4>
                  <div className="space-y-1">
                    {locationQuests.slice(0, 3).map(quest => (
                      <div key={quest.id} className="flex items-center space-x-2 text-sm">
                        <span className={`w-2 h-2 rounded-full ${
                          quest.importance === 'high' ? 'bg-red-500' :
                          quest.importance === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></span>
                        <span className="text-gray-900">{quest.title}</span>
                      </div>
                    ))}
                    {locationQuests.length > 3 && (
                      <p className="text-xs text-gray-500">+{locationQuests.length - 3} more</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timestamps */}
          {(location.createdAt || location.updatedAt) && (
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
              {location.createdAt && (
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-3 w-3" />
                  <span>Created {new Date(location.createdAt).toLocaleDateString()}</span>
                </div>
              )}
              {location.updatedAt && location.updatedAt !== location.createdAt && (
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-3 w-3" />
                  <span>Updated {new Date(location.updatedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
