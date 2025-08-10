import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { useAppStore } from '@/stores/useAppStore';
import { useMap } from '@/hooks/useMap';
import { getClusterIcon, shouldClusterMarkers } from '@/lib/mapUtils';
import type { NPC, Quest, Location, MarkerStyle } from '@/types';

export function CustomMarkers() {
  const { npcs, quests, locations, currentCampaign, mapState } = useAppStore();
  const { clusteringEnabled, currentTheme } = useMap();

  if (!currentCampaign) return null;

  const campaignNPCs = npcs.filter(npc => npc.campaignId === currentCampaign.id);
  const campaignQuests = quests.filter(quest => quest.campaignId === currentCampaign.id && quest.status === 'active');
  const campaignLocations = locations.filter(location => location.campaignId === currentCampaign.id);

  // Group markers by location for clustering
  const markerGroups = useMemo(() => {
    const groups = new Map<string, { location: Location; npcs: NPC[]; quests: Quest[] }>();

    campaignLocations.forEach(location => {
      const locationNPCs = campaignNPCs.filter(npc => npc.locationId === location.id);
      const locationQuests = campaignQuests.filter(quest => quest.locationIds.includes(location.id));
      
      groups.set(location.id, {
        location,
        npcs: locationNPCs,
        quests: locationQuests
      });
    });

    return groups;
  }, [campaignLocations, campaignNPCs, campaignQuests]);

  const shouldCluster = clusteringEnabled && shouldClusterMarkers(mapState.zoom, markerGroups.size);

  return (
    <>
      {Array.from(markerGroups.values()).map(group => {
        const totalMarkers = 1 + group.npcs.length + group.quests.length; // +1 for location marker
        
        if (shouldCluster && totalMarkers > 1) {
          return (
            <ClusteredMarker
              key={group.location.id}
              group={group}
              totalMarkers={totalMarkers}
              markerStyle={currentTheme.markerStyle}
            />
          );
        } else {
          return (
            <IndividualMarkers
              key={group.location.id}
              group={group}
              markerStyle={currentTheme.markerStyle}
            />
          );
        }
      })}
    </>
  );
}

interface MarkerGroupProps {
  group: { location: Location; npcs: NPC[]; quests: Quest[] };
  markerStyle: any;
  totalMarkers?: number;
}

function ClusteredMarker({ group, totalMarkers = 1, markerStyle }: MarkerGroupProps) {
  const { selectLocation, mapState } = useAppStore();
  const location = group.location;
  
  const clusterIcon = getClusterIcon(totalMarkers, markerStyle.location.clusterColor || markerStyle.location.color);

  return (
    <Marker
      position={[location.coords.lat, location.coords.lng]}
      icon={clusterIcon}
      eventHandlers={{
        click: () => selectLocation(location.id),
      }}
    >
      <Popup>
        <ClusterPopup group={group} />
      </Popup>
    </Marker>
  );
}

function IndividualMarkers({ group, markerStyle }: MarkerGroupProps) {
  const { selectLocation, selectNPC, selectQuest, mapState } = useAppStore();
  const { location, npcs, quests } = group;

  return (
    <>
      {/* Location Marker */}
      <Marker
        position={[location.coords.lat, location.coords.lng]}
        icon={createCustomIcon('location', location, markerStyle.location, mapState.selectedLocation === location.id)}
        eventHandlers={{
          click: () => selectLocation(location.id),
        }}
      >
        <Popup>
          <LocationPopup location={location} npcs={npcs} quests={quests} />
        </Popup>
      </Marker>

      {/* NPC Markers */}
      {npcs.map((npc, index) => {
        const offset = getMarkerOffset(index + 1, npcs.length + quests.length);
        const position: [number, number] = [
          location.coords.lat + offset.lat,
          location.coords.lng + offset.lng
        ];

        return (
          <Marker
            key={npc.id}
            position={position}
            icon={createCustomIcon('npc', npc, markerStyle.npc, mapState.selectedNpc === npc.id)}
            eventHandlers={{
              click: () => selectNPC(npc.id),
            }}
          >
            <Popup>
              <NPCPopup npc={npc} />
            </Popup>
          </Marker>
        );
      })}

      {/* Quest Markers */}
      {quests.map((quest, index) => {
        const offset = getMarkerOffset(npcs.length + index + 1, npcs.length + quests.length);
        const position: [number, number] = [
          location.coords.lat + offset.lat,
          location.coords.lng + offset.lng
        ];

        return (
          <Marker
            key={quest.id}
            position={position}
            icon={createCustomIcon('quest', quest, markerStyle.quest, mapState.selectedQuest === quest.id)}
            eventHandlers={{
              click: () => selectQuest(quest.id),
            }}
          >
            <Popup>
              <QuestPopup quest={quest} />
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

function createCustomIcon(
  type: 'location' | 'npc' | 'quest',
  entity: Location | NPC | Quest,
  style: MarkerStyle,
  isSelected: boolean
) {
  const size = isSelected ? style.size * 1.4 : style.size;
  const color = isSelected ? style.color : '#ffffff';
  const borderColor = style.color;

  let icon = style.icon;
  if (type === 'location' && 'type' in entity) {
    const iconMap = {
      city: '🏰',
      village: '🏘️',
      landmark: '🗿',
      dungeon: '🕳️',
    };
    icon = iconMap[entity.type] || '📍';
  } else if (type === 'quest' && 'importance' in entity) {
    const iconMap = {
      high: '🔥',
      medium: '⚡',
      low: '💫',
    };
    icon = iconMap[entity.importance] || '⚡';
  }

  return divIcon({
    html: `
      <div style="
        background: ${isSelected ? borderColor : color};
        border: 2px solid ${borderColor};
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.6}px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        cursor: pointer;
        transition: all 0.2s ease;
      ">
        ${icon}
      </div>
    `,
    className: `${type}-marker`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function getMarkerOffset(index: number, total: number): { lat: number; lng: number } {
  if (total <= 1) return { lat: 0, lng: 0 };

  const radius = 0.001; // Small offset in degrees
  const angle = (index / total) * 2 * Math.PI;
  
  return {
    lat: Math.sin(angle) * radius,
    lng: Math.cos(angle) * radius
  };
}

// Popup Components
function ClusterPopup({ group }: { group: { location: Location; npcs: NPC[]; quests: Quest[] } }) {
  const { location, npcs, quests } = group;

  return (
    <div className="min-w-48">
      <h3 className="font-bold text-lg mb-2">{location.name}</h3>
      <p className="text-sm text-gray-600 mb-3">{location.description}</p>
      
      <div className="space-y-2">
        {npcs.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-800">NPCs ({npcs.length})</h4>
            <ul className="text-xs text-gray-600">
              {npcs.slice(0, 3).map(npc => (
                <li key={npc.id}>• {npc.name} ({npc.role})</li>
              ))}
              {npcs.length > 3 && <li>• ... and {npcs.length - 3} more</li>}
            </ul>
          </div>
        )}
        
        {quests.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-800">Active Quests ({quests.length})</h4>
            <ul className="text-xs text-gray-600">
              {quests.slice(0, 3).map(quest => (
                <li key={quest.id}>• {quest.title}</li>
              ))}
              {quests.length > 3 && <li>• ... and {quests.length - 3} more</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function LocationPopup({ location, npcs, quests }: { location: Location; npcs: NPC[]; quests: Quest[] }) {
  const typeLabels = {
    city: 'City',
    village: 'Village',
    landmark: 'Landmark',
    dungeon: 'Dungeon',
  };

  return (
    <div className="min-w-48">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-lg">{location.name}</h3>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {typeLabels[location.type]}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{location.description}</p>
      
      {npcs.length > 0 && (
        <div className="mb-2">
          <h4 className="font-medium text-sm text-gray-800">NPCs:</h4>
          <ul className="text-xs text-gray-600">
            {npcs.map(npc => (
              <li key={npc.id}>• {npc.name} ({npc.role})</li>
            ))}
          </ul>
        </div>
      )}
      
      {quests.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-gray-800">Active Quests:</h4>
          <ul className="text-xs text-gray-600">
            {quests.map(quest => (
              <li key={quest.id}>• {quest.title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function NPCPopup({ npc }: { npc: NPC }) {
  return (
    <div className="min-w-48">
      <h3 className="font-bold text-lg mb-1">{npc.name}</h3>
      <p className="text-sm text-gray-600 mb-2">{npc.role}</p>
      <p className="text-xs text-gray-500 mb-2">{npc.personality}</p>
      
      {npc.portraitUrl && (
        <img 
          src={npc.portraitUrl} 
          alt={npc.name}
          className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
        />
      )}
    </div>
  );
}

function QuestPopup({ quest }: { quest: Quest }) {
  const importanceColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  return (
    <div className="min-w-48">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-lg">{quest.title}</h3>
        <span className={`text-xs px-2 py-1 rounded ${importanceColors[quest.importance]}`}>
          {quest.importance}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-2">{quest.description}</p>
      
      {quest.rewards && (
        <div className="text-xs text-gray-500">
          <strong>Rewards:</strong> {quest.rewards}
        </div>
      )}
    </div>
  );
}
