import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { useAppStore } from '@/stores/useAppStore';
import type { Quest } from '@/types';

export function QuestMarkers() {
  const { quests, locations, npcs, currentCampaign, selectQuest, mapState } = useAppStore();

  if (!currentCampaign) return null;

  const campaignQuests = quests.filter(
    (quest) => quest.campaignId === currentCampaign.id && quest.status === 'active'
  );

  const getQuestIcon = (quest: Quest) => {
    const isSelected = mapState.selectedQuest === quest.id;
    const size = isSelected ? 35 : 25;
    
    // Color based on importance
    const colorMap = {
      high: '#ef4444',    // red
      medium: '#f59e0b',  // yellow
      low: '#10b981',     // green
    };

    const color = colorMap[quest.importance];
    
    return divIcon({
      html: `
        <div style="
          background: ${isSelected ? color : '#ffffff'};
          border: 2px solid ${color};
          border-radius: 50%;
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${size * 0.6}px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          cursor: pointer;
        ">
          ⚡
        </div>
      `,
      className: 'quest-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  const shouldShowQuest = (quest: Quest): boolean => {
    // Show high importance quests at all zoom levels
    if (quest.importance === 'high') return true;
    
    // Show medium importance quests at zoom level 4 and above
    if (quest.importance === 'medium' && mapState.zoom >= 4) return true;
    
    // Show low importance quests at zoom level 6 and above
    if (quest.importance === 'low' && mapState.zoom >= 6) return true;
    
    return false;
  };

  return (
    <>
      {campaignQuests
        .filter(shouldShowQuest)
        .map((quest) => {
          // Use the first location for quest marker position
          const primaryLocation = locations.find((loc) => 
            quest.locationIds.includes(loc.id)
          );
          
          if (!primaryLocation) return null;

          return (
            <Marker
              key={quest.id}
              position={[primaryLocation.coords.lat, primaryLocation.coords.lng]}
              icon={getQuestIcon(quest)}
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

interface QuestPopupProps {
  quest: Quest;
}

function QuestPopup({ quest }: QuestPopupProps) {
  const { locations, npcs } = useAppStore();

  const questLocations = locations.filter((loc) =>
    quest.locationIds.includes(loc.id)
  );
  
  const startNPC = npcs.find((npc) => npc.id === quest.startNpcId);
  const involvedNPCs = npcs.filter((npc) =>
    quest.involvedNpcIds.includes(npc.id)
  );

  const importanceColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  const statusColors = {
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-w-[250px] max-w-[350px]">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-bold text-lg text-gray-900 flex-1">{quest.title}</h3>
        <div className="flex flex-col gap-1 ml-2">
          <span className={`text-xs px-2 py-1 rounded ${importanceColors[quest.importance]}`}>
            {quest.importance.toUpperCase()}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${statusColors[quest.status]}`}>
            {quest.status.toUpperCase()}
          </span>
        </div>
      </div>

      {quest.description && (
        <div className="mb-3">
          <p className="text-sm text-gray-600">{quest.description}</p>
        </div>
      )}

      {startNPC && (
        <div className="mb-3">
          <h4 className="font-medium text-sm text-gray-900 mb-1">Quest Giver:</h4>
          <div className="flex items-center text-sm text-gray-600">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            {startNPC.name} ({startNPC.role})
          </div>
        </div>
      )}

      {involvedNPCs.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-sm text-gray-900 mb-1">Involved NPCs:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {involvedNPCs.map((npc) => (
              <li key={npc.id} className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                {npc.name} ({npc.role})
              </li>
            ))}
          </ul>
        </div>
      )}

      {questLocations.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-sm text-gray-900 mb-1">Locations:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {questLocations.map((location) => (
              <li key={location.id} className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                {location.name} ({location.type})
              </li>
            ))}
          </ul>
        </div>
      )}

      {quest.rewards && (
        <div className="mb-3">
          <h4 className="font-medium text-sm text-gray-900 mb-1">Rewards:</h4>
          <p className="text-sm text-gray-600">{quest.rewards}</p>
        </div>
      )}

      {quest.notes && (
        <div className="mb-3">
          <h4 className="font-medium text-sm text-gray-900 mb-1">Notes:</h4>
          <p className="text-sm text-gray-600">{quest.notes}</p>
        </div>
      )}

      <div className="text-xs text-gray-500 border-t pt-2">
        Click to view full details
      </div>
    </div>
  );
}
