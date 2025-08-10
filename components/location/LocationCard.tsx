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
  const locationQuests = quests.filter(quest => quest.locationIds.includes(location.id));
  const subLocations = getSubLocations(location.id);
  const primaryImage = location.images.find(img => img.isPrimary);

  const typeIcons = {
    city: '🏰',
    village: '🏘️',
    landmark: '🗿',
    dungeon: '🕳️',
  };

  const typeColors = {
    city: 'bg-purple-100 text-purple-800',
    village: 'bg-green-100 text-green-800',
    landmark: 'bg-blue-100 text-blue-800',
    dungeon: 'bg-red-100 text-red-800',
  };

  const handleCardClick = () => {
    selectLocation(location.id);
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
                {typeIcons[location.type]}
              </div>
            </div>

            {/* Location Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {location.name}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[location.type]}`}>
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
                <div className="flex items-center space-x-1">
                  <MapPinIcon className="h-3 w-3" />
                  <span>{location.coords.lat.toFixed(2)}, {location.coords.lng.toFixed(2)}</span>
                </div>
                {location.population && (
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
            
            {location.images.length > 0 && onViewImages && (
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

          {/* Detailed Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-3">
              {location.detailedDescription && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Description</h4>
                  <p className="text-sm text-gray-600">{location.detailedDescription}</p>
                </div>
              )}

              {location.climate && (
                <div className="flex items-center space-x-2">
                  <CloudIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Climate: {location.climate}</span>
                </div>
              )}

              {location.government && (
                <div className="flex items-center space-x-2">
                  <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Government: {location.government}</span>
                </div>
              )}

              {location.economy && (
                <div className="flex items-center space-x-2">
                  <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Economy: {location.economy}</span>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              {location.history && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">History</h4>
                  <p className="text-sm text-gray-600">{location.history}</p>
                </div>
              )}

              {location.rumors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Rumors</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {location.rumors.map((rumor, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span>{rumor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {location.secrets.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Secrets</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {location.secrets.map((secret, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <EyeIcon className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>{secret}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

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

          {/* Sub-locations */}
          {subLocations.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Sub-locations ({subLocations.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {subLocations.map(subLocation => (
                  <div
                    key={subLocation.id}
                    className="flex items-center space-x-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                    onClick={() => selectLocation(subLocation.id)}
                  >
                    <span className="text-lg">{typeIcons[subLocation.type]}</span>
                    <span className="text-sm text-gray-900">{subLocation.name}</span>
                  </div>
                ))}
              </div>
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

      {/* Sub-locations in hierarchy mode */}
      {showHierarchy && isExpanded && subLocations.length > 0 && (
        <div className="border-t border-gray-100">
          {subLocations.map(subLocation => (
            <LocationCard
              key={subLocation.id}
              location={subLocation}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewImages={onViewImages}
              showHierarchy={true}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
