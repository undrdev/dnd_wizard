import React from 'react';
import { CheckIcon, XMarkIcon, UserIcon, MapPinIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import type { ParsedContent } from '@/lib/aiParsers';

interface AIContentPreviewProps {
  content: ParsedContent;
  onAccept: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

export function AIContentPreview({ content, onAccept, onReject, isLoading = false }: AIContentPreviewProps) {
  const hasContent = (content.npcs?.length ?? 0) > 0 || (content.quests?.length ?? 0) > 0 || (content.locations?.length ?? 0) > 0;
  
  if (!hasContent) {
    return null;
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-900">Generated Content Preview</h3>
        <div className="flex space-x-2">
          <button
            onClick={onAccept}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <CheckIcon className="h-4 w-4 mr-1" />
            Accept
          </button>
          <button
            onClick={onReject}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Reject
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* NPCs Preview */}
        {content.npcs && content.npcs.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <UserIcon className="h-5 w-5 text-blue-500 mr-2" />
              <h4 className="text-md font-medium text-gray-900">
                NPCs ({content.npcs.length})
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {content.npcs.map((npc, index) => (
                <NPCPreviewCard key={index} npc={npc} />
              ))}
            </div>
          </div>
        )}
        
        {/* Quests Preview */}
        {content.quests && content.quests.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <ClipboardDocumentListIcon className="h-5 w-5 text-purple-500 mr-2" />
              <h4 className="text-md font-medium text-gray-900">
                Quests ({content.quests.length})
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {content.quests.map((quest, index) => (
                <QuestPreviewCard key={index} quest={quest} />
              ))}
            </div>
          </div>
        )}

        {/* Locations Preview */}
        {content.locations && content.locations.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <MapPinIcon className="h-5 w-5 text-green-500 mr-2" />
              <h4 className="text-md font-medium text-gray-900">
                Locations ({content.locations.length})
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {content.locations.map((location, index) => (
                <LocationPreviewCard key={index} location={location} />
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {content.suggestions && content.suggestions.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-2">Suggestions</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              {content.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Follow-up Questions */}
        {content.followUpQuestions && content.followUpQuestions.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-2">Follow-up Questions</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              {content.followUpQuestions.map((question, index) => (
                <li key={index}>{question}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

interface NPCPreviewCardProps {
  npc: Partial<import('@/types').NPC>;
}

function NPCPreviewCard({ npc }: NPCPreviewCardProps) {
  return (
    <div className="border border-gray-200 rounded-md p-3 bg-blue-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h5 className="font-medium text-gray-900">{npc.name || 'Unnamed NPC'}</h5>
          <p className="text-sm text-gray-600">{npc.role || 'No role specified'}</p>
          {npc.personality && (
            <p className="text-xs text-gray-500 mt-1">{npc.personality}</p>
          )}
        </div>
        <UserIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
      </div>
      {npc.stats && Object.keys(npc.stats).length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Stats: {Object.entries(npc.stats).map(([key, value]) => `${key}: ${value}`).join(', ')}
        </div>
      )}
    </div>
  );
}

interface QuestPreviewCardProps {
  quest: Partial<import('@/types').Quest>;
}

function QuestPreviewCard({ quest }: QuestPreviewCardProps) {
  const importanceColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };
  
  return (
    <div className="border border-gray-200 rounded-md p-3 bg-purple-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h5 className="font-medium text-gray-900">{quest.title || 'Untitled Quest'}</h5>
          <p className="text-sm text-gray-600 mt-1">{quest.description || 'No description'}</p>
          <div className="flex items-center mt-2 space-x-2">
            {quest.importance && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                importanceColors[quest.importance] || importanceColors.medium
              }`}>
                {quest.importance}
              </span>
            )}
            {quest.rewards && (
              <span className="text-xs text-gray-500">Rewards: {quest.rewards}</span>
            )}
          </div>
        </div>
        <ClipboardDocumentListIcon className="h-5 w-5 text-purple-500 flex-shrink-0" />
      </div>
    </div>
  );
}

interface LocationPreviewCardProps {
  location: Partial<import('@/types').Location>;
}

function LocationPreviewCard({ location }: LocationPreviewCardProps) {
  const typeColors = {
    city: 'bg-blue-100 text-blue-800',
    village: 'bg-green-100 text-green-800',
    landmark: 'bg-yellow-100 text-yellow-800',
    dungeon: 'bg-red-100 text-red-800',
  };
  
  return (
    <div className="border border-gray-200 rounded-md p-3 bg-green-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h5 className="font-medium text-gray-900">{location.name || 'Unnamed Location'}</h5>
          <p className="text-sm text-gray-600 mt-1">{location.description || 'No description'}</p>
          <div className="flex items-center mt-2 space-x-2">
            {location.type && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                typeColors[location.type] || typeColors.landmark
              }`}>
                {location.type}
              </span>
            )}
            {location.coords && (
              <span className="text-xs text-gray-500">
                Coords: {location.coords.lat.toFixed(2)}, {location.coords.lng.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        <MapPinIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
      </div>
    </div>
  );
}
