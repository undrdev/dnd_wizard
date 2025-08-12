import React from 'react';
import { 
  MapIcon, 
  UserGroupIcon, 
  BookOpenIcon, 
  StarIcon, 
  LightBulbIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import type { AIGeneratedCampaignData } from '@/types';

interface AICampaignPreviewProps {
  aiData: AIGeneratedCampaignData;
  className?: string;
}

export function AICampaignPreview({ aiData, className = '' }: AICampaignPreviewProps) {
  if (!aiData) return null;

  const sections = [
    {
      title: 'Setting',
      icon: MapIcon,
      content: aiData.setting,
      type: 'text' as const,
    },
    {
      title: 'Plot Hooks',
      icon: LightBulbIcon,
      content: aiData.plotHooks,
      type: 'list' as const,
    },
    {
      title: 'Key Locations',
      icon: MapIcon,
      content: aiData.keyLocations,
      type: 'list' as const,
    },
    {
      title: 'Important NPCs',
      icon: UserGroupIcon,
      content: aiData.importantNPCs,
      type: 'list' as const,
    },
    {
      title: 'Suggested Quests',
      icon: BookOpenIcon,
      content: aiData.suggestedQuests,
      type: 'list' as const,
    },
    {
      title: 'Themes',
      icon: StarIcon,
      content: aiData.themes,
      type: 'list' as const,
    },
    {
      title: 'Challenges',
      icon: ExclamationTriangleIcon,
      content: aiData.challenges,
      type: 'list' as const,
    },
    {
      title: 'Rewards',
      icon: TrophyIcon,
      content: aiData.rewards,
      type: 'list' as const,
    },
  ].filter(section => section.content && 
    (section.type === 'text' ? section.content : (section.content as string[])?.length > 0)
  );

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <SparklesIcon className="h-6 w-6 text-purple-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">AI-Generated Campaign Content</h3>
      </div>

      {/* Campaign Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {aiData.startingLevel && (
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <div className="text-sm font-medium text-gray-600">Starting Level</div>
            <div className="text-lg font-semibold text-gray-900">{aiData.startingLevel}</div>
          </div>
        )}
        {aiData.partySize && (
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <div className="text-sm font-medium text-gray-600">Party Size</div>
            <div className="text-lg font-semibold text-gray-900">{aiData.partySize}</div>
          </div>
        )}
        {aiData.tone && (
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <div className="text-sm font-medium text-gray-600">Tone</div>
            <div className="text-lg font-semibold text-gray-900">{aiData.tone}</div>
          </div>
        )}
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section) => {
          const IconComponent = section.icon;
          return (
            <div key={section.title} className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center mb-3">
                <IconComponent className="h-5 w-5 text-purple-600 mr-2" />
                <h4 className="font-medium text-gray-900">{section.title}</h4>
              </div>
              
              {section.type === 'text' ? (
                <p className="text-gray-700 text-sm leading-relaxed">
                  {section.content as string}
                </p>
              ) : (
                <ul className="space-y-1">
                  {(section.content as string[])?.map((item, index) => (
                    <li key={index} className="text-gray-700 text-sm flex items-start">
                      <span className="text-purple-500 mr-2 mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Generation Timestamp */}
      {aiData.generatedAt && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Generated on {new Date(aiData.generatedAt).toLocaleDateString()} at{' '}
          {new Date(aiData.generatedAt).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
