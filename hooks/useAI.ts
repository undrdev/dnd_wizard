import { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useAIStore } from '@/stores/useAIStore';
import { aiService } from '@/lib/ai';
import { parseCommand, parseAIResponse, type AICommand, type ParsedContent } from '@/lib/aiParsers';
import type { AIMessage, NPC, Quest, Location } from '@/types';

interface UseAIReturn {
  // State
  isGenerating: boolean;
  lastCommand: AICommand | null;
  previewContent: ParsedContent | null;
  error: string | null;
  
  // Actions
  processCommand: (command: string) => Promise<AIMessage>;
  acceptPreviewContent: () => Promise<void>;
  rejectPreviewContent: () => void;
  generateSuggestions: (type: 'npc' | 'quest' | 'location' | 'general') => Promise<string[]>;
  clearError: () => void;
}

export function useAI(): UseAIReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastCommand, setLastCommand] = useState<AICommand | null>(null);
  const [previewContent, setPreviewContent] = useState<ParsedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { getCurrentCampaignData, addNPC, addQuest, addLocation } = useAppStore();
  const { hasValidProvider, addMessage } = useAIStore();
  
  const processCommand = useCallback(async (command: string): Promise<AIMessage> => {
    if (!hasValidProvider()) {
      throw new Error('No valid AI provider configured');
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const { campaign, locations, npcs, quests } = getCurrentCampaignData();
      
      if (!campaign) {
        throw new Error('No active campaign');
      }
      
      // Parse the command
      const parsedCommand = parseCommand(command, { campaign, locations, npcs, quests });
      setLastCommand(parsedCommand);
      
      // Create user message
      const userMessage: AIMessage = {
        role: 'user',
        content: command,
        timestamp: new Date(),
      };
      
      // Add to conversation history
      addMessage(userMessage);
      
      // Process with AI service
      const response = await aiService.processCommand({
        command,
        campaignId: campaign.id,
        context: { campaign, locations, npcs, quests },
      });
      
      if (!response.success) {
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
          const location: Partial<Location> = {
            ...locationData,
            campaignId: campaign.id,
            coords: locationData.coords || { lat: 0, lng: 0 },
            npcs: [],
            quests: [],
          };
          await addLocation(location as Location);
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
  
  return {
    isGenerating,
    lastCommand,
    previewContent,
    error,
    processCommand,
    acceptPreviewContent,
    rejectPreviewContent,
    generateSuggestions,
    clearError,
  };
}
