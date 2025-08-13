import React, { useState } from 'react';
import { 
  SparklesIcon, 
  PencilIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  MapPinIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { NPCCreationForm } from './NPCCreationForm';
import { QuestCreationForm } from './QuestCreationForm';
import { LocationCreationForm } from './LocationCreationForm';
import { useAI } from '@/hooks/useAI';
import { useAppStore } from '@/stores/useAppStore';
import { useToast } from '@/components/ui/Toast';
import type { NPC, Quest, EnhancedLocation } from '@/types';

interface FormSelectorProps {
  type: 'npc' | 'quest' | 'location';
  onClose: () => void;
  className?: string;
}

export function FormSelector({ type, onClose, className = '' }: FormSelectorProps) {
  const [creationMode, setCreationMode] = useState<'ai' | 'manual' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { processCommand, isGenerating: aiIsGenerating } = useAI();
  const { addNPC, addQuest, addLocation } = useAppStore();
  const { addToast } = useToast();

  const handleAICreation = async () => {
    setIsGenerating(true);
    
    try {
      let prompt = '';
      switch (type) {
        case 'npc':
          prompt = 'Create a new interesting NPC for this campaign with detailed personality, background, and stats';
          break;
        case 'quest':
          prompt = 'Create a new quest that fits the campaign theme with objectives, rewards, and consequences';
          break;
        case 'location':
          prompt = 'Create a new detailed location for the campaign world with description, features, and atmosphere';
          break;
      }

      await processCommand(prompt);
      addToast({
        type: 'success',
        title: 'AI Generation Started',
        message: `AI is generating a new ${type}. Check the chat for results.`,
        duration: 3000
      });
      onClose();
    } catch (error) {
      // Error handling is done in the useAI hook, no need for additional error toasts here
      console.error('FormSelector: Error in AI generation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualNPCCreation = (npc: Omit<NPC, 'id' | 'createdAt' | 'updatedAt'>) => {
    addNPC(npc);
    addToast({
      type: 'success',
      title: 'NPC Created',
      message: `${npc.name} has been added to your campaign.`,
      duration: 3000
    });
    onClose();
  };

  const handleManualQuestCreation = (quest: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>) => {
    addQuest(quest);
    addToast({
      type: 'success',
      title: 'Quest Created',
      message: `${quest.title} has been added to your campaign.`,
      duration: 3000
    });
    onClose();
  };

  const handleManualLocationCreation = (location: Omit<EnhancedLocation, 'id' | 'createdAt' | 'updatedAt'>) => {
    addLocation(location);
    addToast({
      type: 'success',
      title: 'Location Created',
      message: `${location.name} has been added to your campaign.`,
      duration: 3000
    });
    onClose();
  };

  const getTypeInfo = () => {
    switch (type) {
      case 'npc':
        return {
          title: 'Create NPC',
          icon: UserIcon,
          color: 'blue',
          description: 'Create a new Non-Player Character for your campaign',
          aiPrompt: 'AI will generate a detailed NPC with personality, background, and stats',
          manualDescription: 'Manually create an NPC with full control over all details'
        };
      case 'quest':
        return {
          title: 'Create Quest',
          icon: ClipboardDocumentListIcon,
          color: 'purple',
          description: 'Create a new quest or adventure for your players',
          aiPrompt: 'AI will generate a quest with objectives, rewards, and consequences',
          manualDescription: 'Manually create a quest with full control over all details'
        };
      case 'location':
        return {
          title: 'Create Location',
          icon: MapPinIcon,
          color: 'green',
          description: 'Create a new location for your campaign world',
          aiPrompt: 'AI will generate a detailed location with description and features',
          manualDescription: 'Manually create a location with full control over all details'
        };
    }
  };

  const typeInfo = getTypeInfo();
  const IconComponent = typeInfo.icon;

  if (creationMode === 'manual') {
    switch (type) {
      case 'npc':
        return (
          <NPCCreationForm
            onSubmit={handleManualNPCCreation}
            onCancel={() => setCreationMode(null)}
            className={className}
          />
        );
      case 'quest':
        return (
          <QuestCreationForm
            onSubmit={handleManualQuestCreation}
            onCancel={() => setCreationMode(null)}
            className={className}
          />
        );
      case 'location':
        return (
          <LocationCreationForm
            onSubmit={handleManualLocationCreation}
            onCancel={() => setCreationMode(null)}
            className={className}
          />
        );
    }
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <IconComponent className={`h-6 w-6 text-${typeInfo.color}-500 mr-2`} />
          <h2 className="text-xl font-semibold text-gray-900">{typeInfo.title}</h2>
        </div>

        <p className="text-gray-600 mb-6">{typeInfo.description}</p>

        {/* Creation Options */}
        <div className="space-y-4">
          {/* AI Option */}
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <SparklesIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-1">AI Generation</h3>
                <p className="text-sm text-gray-600 mb-3">{typeInfo.aiPrompt}</p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleAICreation}
                    disabled={isGenerating || aiIsGenerating}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating || aiIsGenerating ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        Generate with AI
                      </>
                    )}
                  </button>
                  <span className="text-xs text-gray-500">Requires AI setup</span>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Option */}
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                  <PencilIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-1">Manual Creation</h3>
                <p className="text-sm text-gray-600 mb-3">{typeInfo.manualDescription}</p>
                <button
                  onClick={() => setCreationMode('manual')}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Create Manually
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Features Comparison</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-2">AI Generation</h5>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-center">
                  <PlusIcon className="h-3 w-3 text-green-500 mr-1" />
                  Fast and creative
                </li>
                <li className="flex items-center">
                  <PlusIcon className="h-3 w-3 text-green-500 mr-1" />
                  Detailed and coherent
                </li>
                <li className="flex items-center">
                  <PlusIcon className="h-3 w-3 text-green-500 mr-1" />
                  Context-aware
                </li>
                <li className="flex items-center">
                  <PlusIcon className="h-3 w-3 text-green-500 mr-1" />
                  Multiple options
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-2">Manual Creation</h5>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-center">
                  <PlusIcon className="h-3 w-3 text-green-500 mr-1" />
                  Full control
                </li>
                <li className="flex items-center">
                  <PlusIcon className="h-3 w-3 text-green-500 mr-1" />
                  No AI required
                </li>
                <li className="flex items-center">
                  <PlusIcon className="h-3 w-3 text-green-500 mr-1" />
                  Immediate results
                </li>
                <li className="flex items-center">
                  <PlusIcon className="h-3 w-3 text-green-500 mr-1" />
                  Complete customization
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
