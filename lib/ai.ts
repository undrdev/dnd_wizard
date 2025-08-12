import type { AIProviderConfig, AIMessage, AICommandRequest, AICommandResponse } from '@/types';
import { parseCommand, parseAIResponse, type AICommand, type CampaignContext } from './aiParsers';

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

    return Boolean((openai && openai.model) ||
                   (anthropic && anthropic.apiKey && anthropic.model));
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
    if (!config || !config.model) {
      throw new Error('OpenAI configuration not found');
    }

    try {
      console.log('🔍 AI Service: Making OpenAI request to Firebase Functions');
      console.log('🔍 AI Service: Prompt:', prompt.substring(0, 100) + '...');
      console.log('🔍 AI Service: Model:', config.model);
      console.log('🔍 AI Service: Provider: openai');
      
      // Use Firebase Functions instead of local API
      const response = await fetch('https://us-central1-dnd-wizard-app.cloudfunctions.net/generateContentFunction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: config.model,
          systemMessage: this.getSystemPrompt(context),
          temperature: 0.7,
          maxTokens: 2000,
          provider: 'openai',
          apiKey: config.apiKey,
        }),
      });

      console.log('🔍 AI Service: Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI Service: Firebase Functions Error Response:', errorText);
        throw new Error(`Firebase Functions request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 AI Service: Response data:', data);

      if (!data.success) {
        console.error('❌ AI Service: Firebase Functions Error Data:', data);
        throw new Error(`Firebase Functions error: ${data.error || 'Unknown error'}`);
      }

      console.log('✅ AI Service: Successfully received response');
      return this.parseAIResponse(data.data?.message || data.data);
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
      // Use Firebase Functions instead of direct API call
      const response = await fetch('https://us-central1-dnd-wizard-app.cloudfunctions.net/generateContentFunction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: config.model,
          systemMessage: this.getSystemPrompt(context),
          temperature: 0.7,
          maxTokens: 2000,
          provider: 'anthropic',
          apiKey: config.apiKey,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Firebase Functions Error Response:', errorText);
        throw new Error(`Firebase Functions request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        console.error('Firebase Functions Error Data:', data);
        throw new Error(`Firebase Functions error: ${data.error || 'Unknown error'}`);
      }

      return this.parseAIResponse(data.data?.message || data.data);
    } catch (error) {
      console.error('Anthropic generation error:', error);
      throw error;
    }
  }

  private getSystemPrompt(context?: CampaignContext, command?: AICommand): string {
    const basePrompt = `You are an expert D&D campaign assistant specializing in creating rich, interconnected campaign content.

RESPONSE FORMAT: Always respond with valid JSON in this exact structure:
{
  "npcs": [{"name": "string", "role": "string", "personality": "string", "locationId": "string", "stats": {}, "backstory": "string", "goals": ["string"], "secrets": ["string"]}],
  "quests": [{"title": "string", "description": "string", "importance": "low|medium|high", "startNpcId": "string", "involvedNpcIds": ["string"], "locationIds": ["string"], "rewards": "string", "milestones": [{"title": "string", "description": "string"}]}],
  "locations": [{"name": "string", "type": "city|village|landmark|dungeon", "description": "string", "coords": {"lat": number, "lng": number}, "history": "string", "rumors": ["string"], "secrets": ["string"]}],
  "suggestions": ["string"],
  "followUpQuestions": ["string"],
  "message": "A helpful response explaining what was created"
}

CONTENT GUIDELINES:
- Create interconnected content that references existing campaign elements
- NPCs should have clear motivations, backstories, and relationships
- Quests should have multiple steps and meaningful rewards
- Locations should feel lived-in with history and secrets
- Always consider how new content fits with existing elements

Only include arrays that contain new content. Empty arrays should be omitted.`;

    if (context && command) {
      const contextInfo = this.buildContextInfo(context, command);
      return `${basePrompt}

${contextInfo}

COMMAND ANALYSIS:
Type: ${command.type}
Confidence: ${(command.confidence * 100).toFixed(0)}%
Parameters: ${JSON.stringify(command.parameters, null, 2)}

Please create content that directly addresses this command while fitting seamlessly into the existing campaign.`;
    }

    return basePrompt;
  }

  private buildContextInfo(context: CampaignContext, command: AICommand): string {
    let info = `CURRENT CAMPAIGN CONTEXT:
Campaign: "${context.campaign?.title || 'Unknown'}"
Description: ${context.campaign?.description || 'No description'}

EXISTING CONTENT:`;

    if (context.locations?.length > 0) {
      info += `\nLocations (${context.locations.length}):`;
      context.locations.forEach(loc => {
        info += `\n- ${loc.name} (${loc.type}): ${loc.description}`;
      });
    }

    if (context.npcs?.length > 0) {
      info += `\nNPCs (${context.npcs.length}):`;
      context.npcs.forEach(npc => {
        const location = context.locations?.find(l => l.id === npc.locationId);
        info += `\n- ${npc.name} (${npc.role}) at ${location?.name || 'Unknown'}: ${npc.personality}`;
      });
    }

    if (context.quests?.length > 0) {
      info += `\nQuests (${context.quests.length}):`;
      context.quests.forEach(quest => {
        info += `\n- ${quest.title} (${quest.importance}, ${quest.status}): ${quest.description}`;
      });
    }

    // Add specific guidance based on command type
    switch (command.type) {
      case 'CREATE_NPC':
        info += `\n\nFOCUS: Create an NPC that fits the campaign theme and has clear connections to existing locations and potentially other NPCs.`;
        break;
      case 'CREATE_QUEST':
        info += `\n\nFOCUS: Create a quest that involves existing NPCs and locations, with clear objectives and meaningful rewards.`;
        break;
      case 'CREATE_LOCATION':
        info += `\n\nFOCUS: Create a location that fits the campaign world and could house interesting NPCs or quests.`;
        break;
      case 'MODIFY':
        info += `\n\nFOCUS: Modify the specified content while maintaining consistency with the rest of the campaign.`;
        break;
      case 'SUGGEST':
        info += `\n\nFOCUS: Provide creative suggestions that would enhance the campaign and create new story opportunities.`;
        break;
    }

    return info;
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
      console.log('AI Service: Processing command:', request.command);
      
      const provider = this.getPreferredProvider();
      if (!provider) {
        throw new Error('No AI provider configured');
      }

      // Parse the command for better context
      const parsedCommand = parseCommand(request.command, request.context as CampaignContext);
      console.log('AI Service: Parsed command:', parsedCommand);

      // Generate content with enhanced context
      const result = await this.generateContentWithCommand(
        request.command,
        provider,
        request.context as CampaignContext,
        parsedCommand
      );
      
      console.log('AI Service: Generated result:', result);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('AI Service: Command processing error:', error);
      console.error('AI Service: Error stack:', error instanceof Error ? error.stack : 'No stack');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async generateContentWithCommand(
    prompt: string,
    provider: 'openai' | 'anthropic',
    context: CampaignContext,
    command: AICommand
  ): Promise<any> {
    if (!this.hasValidProvider()) {
      throw new Error('No valid AI provider configured');
    }

    switch (provider) {
      case 'openai':
        return this.generateWithOpenAIEnhanced(prompt, context, command);
      case 'anthropic':
        return this.generateWithAnthropicEnhanced(prompt, context, command);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async generateWithOpenAIEnhanced(
    prompt: string,
    context: CampaignContext,
    command: AICommand
  ): Promise<any> {
    const config = this.config.openai;
    if (!config || !config.model) {
      throw new Error('OpenAI configuration not found');
    }

    try {
      const response = await fetch('https://us-central1-dnd-wizard-app.cloudfunctions.net/generateContentFunction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: config.model,
          systemMessage: this.getSystemPrompt(context, command),
          temperature: 0.7,
          maxTokens: 3000,
          provider: 'openai',
          apiKey: config.apiKey,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        console.error('API Error Data:', data);
        throw new Error(`API error: ${data.error || 'Unknown error'}`);
      }

      return this.parseAIResponse(data.content);
    } catch (error) {
      console.error('OpenAI generation error:', error);
      throw error;
    }
  }

  private async generateWithAnthropicEnhanced(
    prompt: string,
    context: CampaignContext,
    command: AICommand
  ): Promise<any> {
    const config = this.config.anthropic;
    if (!config || !config.apiKey) {
      throw new Error('Anthropic configuration not found');
    }

    try {
      const response = await fetch('https://us-central1-dnd-wizard-app.cloudfunctions.net/generateContentFunction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: config.model,
          systemMessage: this.getSystemPrompt(context, command),
          temperature: 0.7,
          maxTokens: 3000,
          provider: 'anthropic',
          apiKey: config.apiKey,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Firebase Functions Error Response:', errorText);
        throw new Error(`Firebase Functions request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        console.error('Firebase Functions Error Data:', data);
        throw new Error(`Firebase Functions error: ${data.error || 'Unknown error'}`);
      }

      return this.parseAIResponse(data.data?.message || data.data);
    } catch (error) {
      console.error('Anthropic generation error:', error);
      throw error;
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
