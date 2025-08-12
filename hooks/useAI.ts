import { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useAIStore } from '@/stores/useAIStore';
import { aiService } from '@/lib/ai';
import { parseCommand, parseAIResponse, type AICommand, type ParsedContent } from '@/lib/aiParsers';
import type { AIMessage, NPC, Quest, EnhancedLocation } from '@/types';

interface UseAIReturn {
  // State
  isGenerating: boolean;
  lastCommand: AICommand | null;
  previewContent: ParsedContent | null;
  error: string | null;
  showKeySetupDialog: boolean;
  
  // Actions
  processCommand: (command: string) => Promise<AIMessage>;
  acceptPreviewContent: () => Promise<void>;
  rejectPreviewContent: () => void;
  generateSuggestions: (type: 'npc' | 'quest' | 'location' | 'general') => Promise<string[]>;
  clearError: () => void;
  onKeySetupComplete: () => void;
}

export function useAI(): UseAIReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastCommand, setLastCommand] = useState<AICommand | null>(null);
  const [previewContent, setPreviewContent] = useState<ParsedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showKeySetupDialog, setShowKeySetupDialog] = useState(false);
  
  const { getCurrentCampaignData, addNPC, addQuest, addLocation } = useAppStore();
  const { hasValidProvider, addMessage } = useAIStore();
  
  const processCommand = useCallback(async (command: string): Promise<AIMessage> => {
    console.log('🔍 useAI: Starting processCommand with:', command);
    
    if (!hasValidProvider()) {
      console.log('❌ useAI: No valid provider, showing setup dialog');
      setShowKeySetupDialog(true);
      throw new Error('No valid AI provider configured. Please set up your API key.');
    }
    
    console.log('✅ useAI: Valid provider found');
    setIsGenerating(true);
    setError(null);
    
    try {
      const { campaign, locations, npcs, quests } = getCurrentCampaignData();
      
      if (!campaign) {
        throw new Error('No active campaign');
      }
      
      console.log('🔍 useAI: Campaign data:', { 
        campaignId: campaign.id, 
        locationsCount: locations.length, 
        npcsCount: npcs.length, 
        questsCount: quests.length 
      });
      
      // Parse the command
      const parsedCommand = parseCommand(command, { campaign, locations, npcs, quests });
      console.log('🔍 useAI: Parsed command:', parsedCommand);
      setLastCommand(parsedCommand);
      
      // Create user message
      const userMessage: AIMessage = {
        role: 'user',
        content: command,
        timestamp: new Date(),
      };
      
      // Add to conversation history
      addMessage(userMessage);
      
      console.log('🔍 useAI: Calling aiService.processCommand');
      
      // Process with AI service
      const response = await aiService.processCommand({
        command,
        campaignId: campaign.id,
        context: { campaign, locations, npcs, quests },
      });
      
      console.log('🔍 useAI: AI service response:', response);
      
      if (!response.success) {
        console.error('❌ useAI: AI processing failed:', response.error);
        throw new Error(response.error || 'AI processing failed');
      }
      
      // Parse AI response
      const parsedContent = parseAIResponse(response.data?.message || '');
      setPreviewContent(parsedContent);
      
      // Create assistant message
      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: response.data?.message || 'Content generated successfully!',
        timestamp: new Date(),
      };
      
      // Add to conversation history
      addMessage(assistantMessage);
      
      return assistantMessage;
    } catch (err) {
      console.error('AI processing error:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        command: command
      });
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      const errorResponse: AIMessage = {
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      };
      
      addMessage(errorResponse);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [hasValidProvider, getCurrentCampaignData, addMessage]);
  
  const acceptPreviewContent = useCallback(async (): Promise<void> => {
    if (!previewContent || !lastCommand) {
      return;
    }
    
    const { campaign } = getCurrentCampaignData();
    if (!campaign) {
      throw new Error('No active campaign');
    }
    
    try {
      // Add NPCs
      if (previewContent.npcs?.length) {
        for (const npcData of previewContent.npcs) {
          const npc: Partial<NPC> = {
            ...npcData,
            campaignId: campaign.id,
            locationId: npcData.locationId || '',
            stats: npcData.stats || {},
            quests: [],
          };
          await addNPC(npc as NPC);
        }
      }
      
      // Add Quests
      if (previewContent.quests?.length) {
        for (const questData of previewContent.quests) {
          const quest: Partial<Quest> = {
            ...questData,
            campaignId: campaign.id,
            status: 'active',
            startNpcId: questData.startNpcId || '',
            involvedNpcIds: questData.involvedNpcIds || [],
            locationIds: questData.locationIds || [],
          };
          await addQuest(quest as Quest);
        }
      }
      
      // Add Locations
      if (previewContent.locations?.length) {
        for (const locationData of previewContent.locations) {
          const location: Partial<EnhancedLocation> = {
            ...locationData,
            campaignId: campaign.id,
            coords: locationData.coords || { lat: 0, lng: 0 },
            npcs: [],
            quests: [],
            subLocations: [],
            images: [],
            hierarchyLevel: 3,
            size: 'medium',
            // Add default enhanced data
            geography: {
              terrain: 'Mixed',
              topography: 'Varied',
              naturalFeatures: [],
              climateZone: 'Temperate',
              flora: [],
              fauna: [],
              naturalResources: [],
              weatherPatterns: 'Seasonal',
              naturalDisasters: []
            },
            architecture: {
              buildingStyles: [],
              materials: [],
              cityLayout: 'Organic',
              fortifications: 'Basic',
              notableBuildings: []
            },
            politics: {
              governmentType: 'Local council',
              rulers: [],
              laws: [],
              conflicts: [],
              alliances: [],
              politicalStatus: 'Stable'
            },
            economy: {
              tradeGoods: [],
              currency: 'Gold pieces',
              markets: [],
              guilds: [],
              industries: [],
              economicStatus: 'Moderate'
            },
            culture: {
              demographics: [],
              languages: ['Common'],
              customs: [],
              festivals: [],
              religions: [],
              socialStructure: 'Traditional'
            },
            climate: {
              temperatureRange: 'Moderate',
              seasons: ['Spring', 'Summer', 'Autumn', 'Winter'],
              precipitation: 'Regular',
              weatherEvents: []
            },
            legends: [],
            rumors: [],
            secrets: [],
            notableFeatures: [],
            magicalProperties: [],
            history: '',
            detailedDescription: locationData.description || ''
          };
          await addLocation(location as EnhancedLocation);
        }
      }
      
      // Clear preview
      setPreviewContent(null);
      setLastCommand(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add content';
      setError(errorMessage);
      throw err;
    }
  }, [previewContent, lastCommand, getCurrentCampaignData, addNPC, addQuest, addLocation]);
  
  const rejectPreviewContent = useCallback((): void => {
    setPreviewContent(null);
    setLastCommand(null);
  }, []);
  
  const generateSuggestions = useCallback(async (
    type: 'npc' | 'quest' | 'location' | 'general'
  ): Promise<string[]> => {
    if (!hasValidProvider()) {
      throw new Error('No valid AI provider configured');
    }
    
    const { campaign, locations, npcs, quests } = getCurrentCampaignData();
    
    if (!campaign) {
      throw new Error('No active campaign');
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const suggestionPrompts = {
        npc: `Suggest 3 interesting NPCs for the campaign "${campaign.title}". Consider the existing locations and story.`,
        quest: `Suggest 3 engaging quests for the campaign "${campaign.title}". Consider the existing NPCs and locations.`,
        location: `Suggest 3 interesting locations for the campaign "${campaign.title}". Consider the existing world and story.`,
        general: `Provide 3 general suggestions to enhance the campaign "${campaign.title}".`,
      };
      
      const response = await aiService.processCommand({
        command: suggestionPrompts[type],
        campaignId: campaign.id,
        context: { campaign, locations, npcs, quests },
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to generate suggestions');
      }
      
      // Parse suggestions from response
      const content = response.data?.message || '';
      const suggestions = content
        .split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 3);
      
      return suggestions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate suggestions';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [hasValidProvider, getCurrentCampaignData]);
  
    const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const handleKeySetupComplete = useCallback((): void => {
    setShowKeySetupDialog(false);
    setError(null);
  }, []);

  return {
    isGenerating,
    lastCommand,
    previewContent,
    error,
    showKeySetupDialog,
    processCommand,
    acceptPreviewContent,
    rejectPreviewContent,
    generateSuggestions,
    clearError,
    onKeySetupComplete: handleKeySetupComplete,
  };
}
