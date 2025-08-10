import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import {
  SparklesIcon,
  XMarkIcon,
  ClockIcon,
  UsersIcon,
  MapIcon,
  BookOpenIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { enhancedAI, FullCampaignRequest, GeneratedCampaign } from '@/lib/enhancedAI';
import { useAppStore } from '@/stores/useAppStore';
import { CampaignService, NPCService, QuestService, LocationService } from '@/lib/firestore';

interface FullCampaignGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FullCampaignGenerator({ isOpen, onClose }: FullCampaignGeneratorProps) {
  const { addCampaign, addNPC, addQuest, addLocation } = useAppStore();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [formData, setFormData] = useState<FullCampaignRequest>({
    title: '',
    theme: 'fantasy',
    setting: 'medieval fantasy world',
    playerLevel: 1,
    partySize: 4,
    campaignLength: 'medium',
    tone: 'heroic',
    includeRomance: false,
    includeIntrigue: false,
    preferredEnemies: [],
  });

  const themes = [
    'High Fantasy', 'Dark Fantasy', 'Urban Fantasy', 'Steampunk',
    'Post-Apocalyptic', 'Space Opera', 'Cyberpunk', 'Horror',
    'Mystery', 'Political Intrigue', 'Exploration', 'War'
  ];

  const tones = [
    { value: 'heroic', label: 'Heroic', description: 'Classic heroes saving the day' },
    { value: 'dark', label: 'Dark', description: 'Gritty, morally complex stories' },
    { value: 'comedic', label: 'Comedic', description: 'Light-hearted and humorous' },
    { value: 'political', label: 'Political', description: 'Intrigue and diplomacy focused' },
    { value: 'exploration', label: 'Exploration', description: 'Discovery and adventure' },
  ];

  const campaignLengths = [
    { value: 'short', label: 'Short (3-5 sessions)', sessions: '3-5' },
    { value: 'medium', label: 'Medium (6-10 sessions)', sessions: '6-10' },
    { value: 'long', label: 'Long (11+ sessions)', sessions: '11+' },
  ];

  const handleInputChange = (field: keyof FullCampaignRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEnemyToggle = (enemy: string) => {
    setFormData(prev => ({
      ...prev,
      preferredEnemies: prev.preferredEnemies?.includes(enemy)
        ? prev.preferredEnemies.filter(e => e !== enemy)
        : [...(prev.preferredEnemies || []), enemy]
    }));
  };

  const handleGenerate = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a campaign title');
      return;
    }

    setIsGenerating(true);
    
    try {
      setGenerationStep('Generating campaign structure...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGenerationStep('Creating NPCs and characters...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setGenerationStep('Designing quests and storylines...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setGenerationStep('Building locations and world...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setGenerationStep('Weaving the narrative together...');
      
      const generatedCampaign = await enhancedAI.generateFullCampaign(formData);
      
      // Add campaign to store
      if (generatedCampaign.campaign && generatedCampaign.campaign.title) {
        const campaignData = {
          ownerId: generatedCampaign.campaign.ownerId || '',
          title: generatedCampaign.campaign.title,
          description: generatedCampaign.campaign.description || '',
          mapSeed: generatedCampaign.campaign.mapSeed || '',
        };
        const campaignId = await CampaignService.createCampaign(campaignData);
        const campaign = {
          id: campaignId,
          ...campaignData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        addCampaign(campaign);
        
        // Add all generated content
        for (const npc of generatedCampaign.npcs) {
          npc.campaignId = campaign.id;
          const npcId = await NPCService.createNPC(npc);
          addNPC({ ...npc, id: npcId });
        }

        for (const quest of generatedCampaign.quests) {
          quest.campaignId = campaign.id;
          const questId = await QuestService.createQuest(quest);
          addQuest({ ...quest, id: questId });
        }

        for (const location of generatedCampaign.locations) {
          location.campaignId = campaign.id;
          const locationId = await LocationService.createLocation(location);
          addLocation({ ...location, id: locationId });
        }
        
        setGenerationStep('Campaign generated successfully!');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        onClose();
      }
    } catch (error) {
      console.error('Error generating campaign:', error);
      alert('Failed to generate campaign. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[9999]">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <SparklesIcon className="h-6 w-6 text-purple-600" />
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Generate Full Campaign
              </Dialog.Title>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isGenerating}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {isGenerating ? (
            /* Generation Progress */
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Creating Your Campaign...
              </h3>
              <p className="text-gray-600">{generationStep}</p>
              <div className="mt-4 bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full transition-all duration-1000 w-3/4"></div>
              </div>
            </div>
          ) : (
            /* Form */
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter your campaign title..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Theme
                    </label>
                    <select
                      value={formData.theme}
                      onChange={(e) => handleInputChange('theme', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {themes.map(theme => (
                        <option key={theme} value={theme.toLowerCase()}>
                          {theme}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Setting
                    </label>
                    <input
                      type="text"
                      value={formData.setting}
                      onChange={(e) => handleInputChange('setting', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Medieval fantasy world"
                    />
                  </div>
                </div>
              </div>

              {/* Campaign Parameters */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Cog6ToothIcon className="h-5 w-5 mr-2" />
                  Campaign Parameters
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Player Level
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.playerLevel}
                      onChange={(e) => handleInputChange('playerLevel', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Party Size
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="8"
                      value={formData.partySize}
                      onChange={(e) => handleInputChange('partySize', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Length
                    </label>
                    <select
                      value={formData.campaignLength}
                      onChange={(e) => handleInputChange('campaignLength', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {campaignLengths.map(length => (
                        <option key={length.value} value={length.value}>
                          {length.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tone Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Campaign Tone</h3>
                <div className="grid grid-cols-1 gap-2">
                  {tones.map(tone => (
                    <label key={tone.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="tone"
                        value={tone.value}
                        checked={formData.tone === tone.value}
                        onChange={(e) => handleInputChange('tone', e.target.value)}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{tone.label}</div>
                        <div className="text-sm text-gray-600">{tone.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Optional Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Optional Features</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.includeRomance}
                      onChange={(e) => handleInputChange('includeRomance', e.target.checked)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-gray-700">Include Romance Subplots</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.includeIntrigue}
                      onChange={(e) => handleInputChange('includeIntrigue', e.target.checked)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-gray-700">Include Political Intrigue</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!formData.title.trim()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <SparklesIcon className="h-4 w-4" />
                  <span>Generate Campaign</span>
                </button>
              </div>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
