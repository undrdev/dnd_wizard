import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { useAppStore } from '@/stores/useAppStore';
import type { NPC } from '@/types';

export function NPCMarkers() {
  const { npcs, locations, currentCampaign, selectNPC, mapState } = useAppStore();

  if (!currentCampaign) return null;

  const campaignNPCs = npcs.filter((npc) => npc.campaignId === currentCampaign.id);

  const getNPCIcon = (npc: NPC) => {
    const isSelected = mapState.selectedNpc === npc.id;
    const size = isSelected ? 35 : 25;
    
    return divIcon({
      html: `
        <div style="
          background: ${isSelected ? '#10b981' : '#ffffff'};
          border: 2px solid #10b981;
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
          👤
        </div>
      `,
      className: 'npc-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  return (
    <>
      {campaignNPCs.map((npc) => {
        const location = locations.find((loc) => loc.id === npc.locationId);
        if (!location) return null;

        return (
          <Marker
            key={npc.id}
            position={[location.coords.lat, location.coords.lng]}
            icon={getNPCIcon(npc)}
            eventHandlers={{
              click: () => selectNPC(npc.id),
            }}
          >
            <Popup>
              <NPCPopup npc={npc} location={location} />
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

interface NPCPopupProps {
  npc: NPC;
  location: any;
}

function NPCPopup({ npc, location }: NPCPopupProps) {
  const { quests } = useAppStore();

  const npcQuests = quests.filter(
    (quest) =>
      quest.startNpcId === npc.id || quest.involvedNpcIds.includes(npc.id)
  );

  return (
    <div className="min-w-[200px] max-w-[300px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-lg text-gray-900">{npc.name}</h3>
        {npc.portraitUrl && (
          <img
            src={npc.portraitUrl}
            alt={npc.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
          />
        )}
      </div>

      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700">{npc.role}</p>
        <p className="text-xs text-gray-500">📍 {location.name}</p>
      </div>

      {npc.personality && (
        <div className="mb-3">
          <h4 className="font-medium text-sm text-gray-900 mb-1">Personality:</h4>
          <p className="text-sm text-gray-600">{npc.personality}</p>
        </div>
      )}

      {Object.keys(npc.stats).length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-sm text-gray-900 mb-1">Stats:</h4>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.entries(npc.stats).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600 capitalize">{key}:</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {npcQuests.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-sm text-gray-900 mb-1">Related Quests:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {npcQuests.map((quest) => (
              <li key={quest.id} className="flex items-center">
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    quest.startNpcId === npc.id ? 'bg-blue-500' : 'bg-gray-400'
                  }`}
                ></span>
                <span>
                  {quest.title}
                  {quest.startNpcId === npc.id && ' (Quest Giver)'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-xs text-gray-500 border-t pt-2">
        Click to view full details
      </div>
    </div>
  );
}
