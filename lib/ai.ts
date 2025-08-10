import type { AIProviderConfig, AIMessage, AICommandRequest, AICommandResponse } from '@/types';

// AI Service class for handling AI provider interactions
export class AIService {
  private static instance: AIService;
  private config: AIProviderConfig = {};

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  setConfig(config: AIProviderConfig) {
    this.config = config;
  }

  getConfig(): AIProviderConfig {
    return this.config;
  }

  hasValidProvider(): boolean {
    const openai = this.config.openai;
    const anthropic = this.config.anthropic;
    
    return (openai && openai.apiKey && openai.model) || 
           (anthropic && anthropic.apiKey && anthropic.model);
  }

  async generateContent(
    prompt: string,
    provider: 'openai' | 'anthropic',
    context?: any
  ): Promise<any> {
    if (!this.hasValidProvider()) {
      throw new Error('No valid AI provider configured');
    }

    switch (provider) {
      case 'openai':
        return this.generateWithOpenAI(prompt, context);
      case 'anthropic':
        return this.generateWithAnthropic(prompt, context);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async generateWithOpenAI(prompt: string, context?: any): Promise<any> {
    const config = this.config.openai;
    if (!config || !config.apiKey) {
      throw new Error('OpenAI configuration not found');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(context),
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseAIResponse(data.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI generation error:', error);
      throw error;
    }
  }

  private async generateWithAnthropic(prompt: string, context?: any): Promise<any> {
    const config = this.config.anthropic;
    if (!config || !config.apiKey) {
      throw new Error('Anthropic configuration not found');
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 2000,
          system: this.getSystemPrompt(context),
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseAIResponse(data.content[0].text);
    } catch (error) {
      console.error('Anthropic generation error:', error);
      throw error;
    }
  }

  private getSystemPrompt(context?: any): string {
    const basePrompt = `You are an AI assistant specialized in creating and managing tabletop RPG campaigns. You help Game Masters create engaging NPCs, quests, locations, and storylines.

When responding to requests, always try to provide structured data that can be used to populate the campaign world. Format your responses as JSON when creating new content.

For NPCs, include: name, role, personality, stats (if relevant), and location.
For Quests, include: title, description, importance (low/medium/high), involved NPCs, and locations.
For Locations, include: name, type (city/village/landmark/dungeon), description, and coordinates.

Be creative, engaging, and consistent with the established campaign world.`;

    if (context) {
      return `${basePrompt}

Current Campaign Context:
${JSON.stringify(context, null, 2)}

Use this context to ensure consistency with the existing world.`;
    }

    return basePrompt;
  }

  private parseAIResponse(content: string): any {
    try {
      // Try to parse as JSON first
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try to parse the entire content as JSON
      return JSON.parse(content);
    } catch (error) {
      // If not JSON, return as plain text response
      return {
        message: content,
        npcs: [],
        quests: [],
        locations: [],
      };
    }
  }

  async processCommand(request: AICommandRequest): Promise<AICommandResponse> {
    try {
      const provider = this.getPreferredProvider();
      if (!provider) {
        throw new Error('No AI provider configured');
      }

      const result = await this.generateContent(
        request.command,
        provider,
        request.context
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Command processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private getPreferredProvider(): 'openai' | 'anthropic' | null {
    if (this.config.openai?.apiKey) return 'openai';
    if (this.config.anthropic?.apiKey) return 'anthropic';
    return null;
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();

// Utility functions for AI interactions
export const AIUtils = {
  formatCampaignContext: (campaign: any, locations: any[], npcs: any[], quests: any[]) => {
    return {
      campaign: {
        title: campaign.title,
        description: campaign.description,
      },
      locations: locations.map(loc => ({
        name: loc.name,
        type: loc.type,
        description: loc.description,
      })),
      npcs: npcs.map(npc => ({
        name: npc.name,
        role: npc.role,
        personality: npc.personality,
        location: locations.find(l => l.id === npc.locationId)?.name,
      })),
      quests: quests.map(quest => ({
        title: quest.title,
        description: quest.description,
        importance: quest.importance,
        status: quest.status,
      })),
    };
  },

  generatePromptForNewNPC: (locationName?: string) => {
    const basePrompt = 'Create a new NPC for this campaign.';
    if (locationName) {
      return `${basePrompt} The NPC should be located in ${locationName}.`;
    }
    return basePrompt;
  },

  generatePromptForNewQuest: (npcName?: string, locationName?: string) => {
    let prompt = 'Create a new quest for this campaign.';
    if (npcName) {
      prompt += ` The quest should involve ${npcName}.`;
    }
    if (locationName) {
      prompt += ` The quest should take place in or around ${locationName}.`;
    }
    return prompt;
  },

  generatePromptForNewLocation: (locationType?: string) => {
    const basePrompt = 'Create a new location for this campaign.';
    if (locationType) {
      return `${basePrompt} The location should be a ${locationType}.`;
    }
    return basePrompt;
  },
};
