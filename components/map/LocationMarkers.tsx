import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { useAppStore } from '@/stores/useAppStore';
import type { Location } from '@/types';

export function LocationMarkers() {
  const { locations, currentCampaign, selectLocation, mapState } = useAppStore();

  if (!currentCampaign) return null;

  const campaignLocations = locations.filter(
    (location) => location.campaignId === currentCampaign.id
  );

  const getLocationIcon = (location: Location) => {
    const iconMap = {
      city: '🏰',
      village: '🏘️',
      landmark: '🗿',
      dungeon: '🕳️',
    };

    const isSelected = mapState.selectedLocation === location.id;
    const size = isSelected ? 40 : 30;
    
    return divIcon({
      html: `
        <div style="
          background: ${isSelected ? '#3b82f6' : '#ffffff'};
          border: 2px solid #3b82f6;
          border-radius: 50%;
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${size * 0.5}px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          cursor: pointer;
        ">
          ${iconMap[location.type] || '📍'}
        </div>
      `,
      className: 'location-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  return (
    <>
      {campaignLocations.map((location) => (
        <Marker
          key={location.id}
          position={[location.coords.lat, location.coords.lng]}
          icon={getLocationIcon(location)}
          eventHandlers={{
            click: () => selectLocation(location.id),
          }}
        >
          <Popup>
            <LocationPopup location={location} />
          </Popup>
        </Marker>
      ))}
    </>
  );
}

interface LocationPopupProps {
  location: Location;
}

function LocationPopup({ location }: LocationPopupProps) {
  const { npcs, quests } = useAppStore();

  const locationNPCs = npcs.filter((npc) => npc.locationId === location.id);
  const locationQuests = quests.filter((quest) =>
    quest.locationIds.includes(location.id)
  );

  const typeLabels = {
    city: 'City',
    village: 'Village',
    landmark: 'Landmark',
    dungeon: 'Dungeon',
  };

  return (
    <div className="min-w-[200px] max-w-[300px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-lg text-gray-900">{location.name}</h3>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {typeLabels[location.type]}
        </span>
      </div>

      {location.description && (
        <p className="text-sm text-gray-600 mb-3">{location.description}</p>
      )}

      {locationNPCs.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-sm text-gray-900 mb-1">NPCs:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {locationNPCs.map((npc) => (
              <li key={npc.id} className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                {npc.name} ({npc.role})
              </li>
            ))}
          </ul>
        </div>
      )}

      {locationQuests.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-sm text-gray-900 mb-1">Quests:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {locationQuests.map((quest) => (
              <li key={quest.id} className="flex items-center">
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    quest.importance === 'high'
                      ? 'bg-red-500'
                      : quest.importance === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                ></span>
                {quest.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-xs text-gray-500 border-t pt-2">
        Coordinates: {location.coords.lat.toFixed(4)}, {location.coords.lng.toFixed(4)}
      </div>
    </div>
  );
}
