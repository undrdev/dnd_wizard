import React, { useState } from 'react';
import { XMarkIcon, ChatBubbleLeftIcon, UsersIcon, MapIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/useAppStore';
import { AIChat } from '@/components/ai/AIChat';
import { QuestList } from '@/components/quest/QuestList';

interface CampaignSidebarProps {
  onClose: () => void;
}

type SidebarTab = 'ai' | 'npcs' | 'quests' | 'locations';

export function CampaignSidebar({ onClose }: CampaignSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('ai');
  const { getCurrentCampaignData } = useAppStore();
  
  const { campaign, locations, npcs, quests } = getCurrentCampaignData();

  const tabs = [
    { id: 'ai' as const, name: 'AI Assistant', icon: ChatBubbleLeftIcon },
    { id: 'npcs' as const, name: 'NPCs', icon: UsersIcon, count: npcs.length },
    { id: 'quests' as const, name: 'Quests', icon: ClipboardDocumentListIcon, count: quests.length },
    { id: 'locations' as const, name: 'Locations', icon: MapIcon, count: locations.length },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Campaign Tools</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{tab.name}</span>
              {tab.count !== undefined && (
                <span className="ml-1 bg-gray-200 text-gray-600 text-xs rounded-full px-2 py-0.5">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'ai' && <AIChat />}
        {activeTab === 'npcs' && <NPCList npcs={npcs} />}
        {activeTab === 'quests' && <QuestList compact />}
        {activeTab === 'locations' && <LocationList locations={locations} />}
      </div>
    </div>
  );
}

// NPC List Component
function NPCList({ npcs }: { npcs: any[] }) {
  const { selectNPC, getSelectedNPC } = useAppStore();
  const selectedNPC = getSelectedNPC();

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-3">
        {npcs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UsersIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No NPCs yet</p>
            <p className="text-sm">Use the AI assistant to create some!</p>
          </div>
        ) : (
          npcs.map((npc) => (
            <div
              key={npc.id}
              onClick={() => selectNPC(npc.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedNPC?.id === npc.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {npc.name}
                  </h4>
                  <p className="text-xs text-gray-500">{npc.role}</p>
                  {npc.personality && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {npc.personality}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}



// Location List Component
function LocationList({ locations }: { locations: any[] }) {
  const { selectLocation, getSelectedLocation } = useAppStore();
  const selectedLocation = getSelectedLocation();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'city': return '🏰';
      case 'village': return '🏘️';
      case 'landmark': return '🗿';
      case 'dungeon': return '🕳️';
      default: return '📍';
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-3">
        {locations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No locations yet</p>
            <p className="text-sm">Use the AI assistant to create some!</p>
          </div>
        ) : (
          locations.map((location) => (
            <div
              key={location.id}
              onClick={() => selectLocation(location.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedLocation?.id === location.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start">
                <span className="text-lg mr-3">{getTypeIcon(location.type)}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {location.name}
                  </h4>
                  <p className="text-xs text-gray-500 capitalize">{location.type}</p>
                  {location.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {location.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
