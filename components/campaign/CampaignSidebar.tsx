import React, { useState } from 'react';
import { XMarkIcon, ChatBubbleLeftIcon, UsersIcon, MapIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/useAppStore';
import { AIChat } from '@/components/ai/AIChat';
import { QuestList } from '@/components/quest/QuestList';
import { NPCList } from '@/components/npc/NPCList';
import { LocationList } from '@/components/location/LocationList';

interface CampaignSidebarProps {
  onClose: () => void;
}

type SidebarTab = 'ai' | 'npcs' | 'quests' | 'locations';

export function CampaignSidebar({ onClose }: CampaignSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('ai');
  const { getCurrentCampaignData } = useAppStore();
  
  const { locations, npcs, quests } = getCurrentCampaignData();

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
              className={`flex-1 flex items-center justify-center px-2 sm:px-3 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{tab.name}</span>
              {tab.count !== undefined && (
                <span className="ml-1 bg-gray-200 text-gray-600 text-xs rounded-full px-1.5 sm:px-2 py-0.5">
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
        {activeTab === 'npcs' && <NPCList className="h-full overflow-y-auto p-4" />}
        {activeTab === 'quests' && <QuestList compact />}
        {activeTab === 'locations' && <LocationList />}
      </div>
    </div>
  );
}
