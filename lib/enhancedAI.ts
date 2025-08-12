import { Campaign, NPC, Quest, EnhancedLocation } from '@/types';

// Simple ID generator
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export interface FullCampaignRequest {
  title: string;
  theme: string;
  setting: string;
  playerLevel: number;
  partySize: number;
  campaignLength: 'short' | 'medium' | 'long'; // 3-5, 6-10, 11+ sessions
  tone: 'heroic' | 'dark' | 'comedic' | 'political' | 'exploration';
  includeRomance?: boolean;
  includeIntrigue?: boolean;
  preferredEnemies?: string[];
}

export interface GeneratedCampaign {
  campaign: Partial<Campaign>;
  npcs: NPC[];
  quests: Quest[];
  locations: EnhancedLocation[];
  storyline: {
    acts: CampaignAct[];
    overallPlot: string;
    themes: string[];
    hooks: string[];
  };
}

export interface CampaignAct {
  actNumber: number;
  title: string;
  description: string;
  sessions: number;
  keyEvents: string[];
  climax: string;
  questIds: string[];
  locationIds: string[];
  npcIds: string[];
}

/**
 * Enhanced AI service for generating complete D&D campaigns
 */
export class EnhancedAIService {
  private baseUrl: string;
  private apiConfig: { provider: 'openai' | 'anthropic'; apiKey: string; model: string } | null = null;

  constructor() {
    this.baseUrl = 'https://api.openai.com/v1';
  }

  setAPIConfig(config: { provider: 'openai' | 'anthropic'; apiKey: string; model: string }) {
    this.apiConfig = config;
  }

  /**
   * Generate a complete D&D campaign with NPCs, quests, locations, and storyline
   */
  async generateFullCampaign(request: FullCampaignRequest): Promise<GeneratedCampaign> {
    try {
      // Generate the main campaign structure
      const campaignPrompt = this.buildCampaignPrompt(request);
      const campaignResponse = await this.callOpenAI(campaignPrompt);
      const campaignData = this.parseCampaignResponse(campaignResponse);

      // Generate NPCs
      const npcPrompt = this.buildNPCPrompt(request, campaignData);
      const npcResponse = await this.callOpenAI(npcPrompt);
      const npcs = this.parseNPCResponse(npcResponse);

      // Generate Quests
      const questPrompt = this.buildQuestPrompt(request, campaignData, npcs);
      const questResponse = await this.callOpenAI(questPrompt);
      const quests = this.parseQuestResponse(questResponse);

      // Generate Locations
      const locationPrompt = this.buildLocationPrompt(request, campaignData);
      const locationResponse = await this.callOpenAI(locationPrompt);
      const locations = this.parseLocationResponse(locationResponse);

      // Generate Storyline
      const storylinePrompt = this.buildStorylinePrompt(request, campaignData, npcs, quests, locations);
      const storylineResponse = await this.callOpenAI(storylinePrompt);
      const storyline = this.parseStorylineResponse(storylineResponse);

      return {
        campaign: {
          id: generateId(),
          title: request.title,
          description: campaignData.description,
          mapSeed: this.generateMapSeed(request.title),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        npcs,
        quests,
        locations,
        storyline,
      };
    } catch (error) {
      console.error('Error generating full campaign:', error);
      throw new Error('Failed to generate campaign. Please try again.');
    }
  }

  private buildCampaignPrompt(request: FullCampaignRequest): string {
    return `Create a detailed D&D campaign with the following specifications:

Title: ${request.title}
Theme: ${request.theme}
Setting: ${request.setting}
Player Level: ${request.playerLevel}
Party Size: ${request.partySize}
Campaign Length: ${request.campaignLength}
Tone: ${request.tone}
Include Romance: ${request.includeRomance ? 'Yes' : 'No'}
Include Intrigue: ${request.includeIntrigue ? 'Yes' : 'No'}
Preferred Enemies: ${request.preferredEnemies?.join(', ') || 'Any'}

Please provide:
1. A compelling campaign description (2-3 paragraphs)
2. The main conflict/threat
3. Key themes to explore
4. The campaign's unique hook
5. Suggested starting location

Format your response as JSON with the following structure:
{
  "description": "campaign description",
  "mainConflict": "primary threat or conflict",
  "themes": ["theme1", "theme2", "theme3"],
  "hook": "compelling reason for adventure",
  "startingLocation": "where the campaign begins"
}`;
  }

  private buildNPCPrompt(request: FullCampaignRequest, campaignData: any): string {
    const npcCount = this.calculateNPCCount(request.campaignLength);
    
    return `Generate ${npcCount} diverse NPCs for the "${request.title}" campaign.

Campaign Context:
- Setting: ${request.setting}
- Theme: ${request.theme}
- Tone: ${request.tone}
- Main Conflict: ${campaignData.mainConflict}

Create a mix of:
- 2-3 Major allies/mentors
- 2-3 Primary antagonists
- 3-4 Quest givers
- 4-6 Supporting characters (merchants, innkeepers, etc.)
- 2-3 Potential romantic interests (if requested)

For each NPC, provide:
- Name, race, class/profession
- Role in the campaign (ally, enemy, neutral, quest giver)
- Personality traits and motivations
- Relationship to the main conflict
- Notable quotes or mannerisms
- Physical description

Format as JSON array of NPC objects.`;
  }

  private buildQuestPrompt(request: FullCampaignRequest, campaignData: any, npcs: NPC[]): string {
    const questCount = this.calculateQuestCount(request.campaignLength);
    
    return `Generate ${questCount} interconnected quests for the "${request.title}" campaign.

Campaign Context:
- Main Conflict: ${campaignData.mainConflict}
- Player Level: ${request.playerLevel}
- Campaign Length: ${request.campaignLength}
- Available NPCs: ${npcs.map(npc => npc.name).join(', ')}

Create a mix of:
- 1 Main storyline quest (multi-part)
- 2-3 Major side quests that tie into the main plot
- 4-6 Minor side quests for character development
- 2-3 Optional exploration/discovery quests

For each quest, provide:
- Title and description
- Quest giver (use NPCs from the list)
- Objectives and potential solutions
- Rewards (XP, gold, magic items, story progression)
- Level requirement and estimated duration
- Connection to other quests or main storyline

Format as JSON array of quest objects.`;
  }

  private buildLocationPrompt(request: FullCampaignRequest, campaignData: any): string {
    const locationCount = this.calculateLocationCount(request.campaignLength);
    
    return `Generate ${locationCount} diverse locations for the "${request.title}" campaign.

Campaign Context:
- Setting: ${request.setting}
- Starting Location: ${campaignData.startingLocation}
- Main Conflict: ${campaignData.mainConflict}

Create a mix of:
- 1 Main hub city/town
- 2-3 Dungeons or dangerous locations
- 2-3 Wilderness areas
- 1-2 Unique/magical locations
- 2-3 Social/political locations

For each location, provide:
- Name and type
- Detailed description
- Key features and points of interest
- Notable inhabitants
- Potential encounters or events
- Connection to quests or storyline
- Atmosphere and mood

Format as JSON array of location objects.`;
  }

  private buildStorylinePrompt(request: FullCampaignRequest, campaignData: any, npcs: NPC[], quests: Quest[], locations: EnhancedLocation[]): string {
    const actCount = request.campaignLength === 'short' ? 3 : request.campaignLength === 'medium' ? 4 : 5;
    
    return `Create a detailed storyline structure for the "${request.title}" campaign.

Available Elements:
- NPCs: ${npcs.map(npc => npc.name).join(', ')}
- Quests: ${quests.map(quest => quest.title).join(', ')}
- Locations: ${locations.map(loc => loc.name).join(', ')}

Create ${actCount} acts with:
- Clear progression from beginning to end
- Rising action, climax, and resolution
- Integration of all major NPCs and locations
- Meaningful character development opportunities
- Satisfying conclusion to the main conflict

For each act, provide:
- Act number and title
- Description and key themes
- Number of sessions
- Key events and milestones
- Climactic moment
- Which quests, NPCs, and locations are featured

Also provide:
- Overall plot summary
- Major themes explored
- Campaign hooks to draw players in

Format as JSON with acts array and overall plot information.`;
  }

  private async callOpenAI(prompt: string): Promise<string> {
    try {
      if (!this.apiConfig) {
        throw new Error('API configuration not set. Please configure your AI provider first.');
      }

      // Make request to our Firebase Function instead of directly to OpenAI
      const response = await fetch('https://us-central1-dnd-wizard-app.cloudfunctions.net/generateContentFunction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: this.apiConfig.model,
          systemMessage: 'You are an expert D&D Dungeon Master with years of experience creating engaging campaigns. Always respond with valid JSON when requested.',
          temperature: 0.7,
          maxTokens: 2000,
          provider: this.apiConfig.provider,
          apiKey: this.apiConfig.apiKey,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Firebase Functions Error Response:', errorText);
        throw new Error(`Firebase Functions request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.success) {
        console.error('Firebase Functions Error Data:', data);
        throw new Error(`Firebase Functions error: ${data.error || 'Unknown error'}`);
      }

      return data.data?.message || data.data || '';
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw new Error('OpenAI API error: Unknown error occurred');
    }
  }

  private parseCampaignResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse campaign response:', error);
      return {
        description: 'A thrilling adventure awaits!',
        mainConflict: 'An ancient evil stirs',
        themes: ['heroism', 'friendship', 'sacrifice'],
        hook: 'The party must save the realm',
        startingLocation: 'A small village',
      };
    }
  }

  private parseNPCResponse(response: string): NPC[] {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed.map(this.convertToNPC) : [];
    } catch (error) {
      console.error('Failed to parse NPC response:', error);
      return [];
    }
  }

  private parseQuestResponse(response: string): Quest[] {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed.map(this.convertToQuest) : [];
    } catch (error) {
      console.error('Failed to parse quest response:', error);
      return [];
    }
  }

  private parseLocationResponse(response: string): EnhancedLocation[] {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed.map(this.convertToLocation) : [];
    } catch (error) {
      console.error('Failed to parse location response:', error);
      return [];
    }
  }

  private parseStorylineResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse storyline response:', error);
      return {
        acts: [],
        overallPlot: 'An epic adventure unfolds',
        themes: ['adventure', 'heroism'],
        hooks: ['The call to adventure'],
      };
    }
  }

  private convertToNPC(data: any): NPC {
    return {
      id: generateId(),
      campaignId: '',
      name: data.name || 'Unknown NPC',
      role: data.role || 'neutral',
      locationId: '',
      personality: data.personality || data.traits || 'Friendly',
      stats: {
        race: data.race || 'Human',
        class: data.class || data.profession || 'Commoner',
        level: data.level || 1,
        background: data.background || data.description || '',
        motivations: data.motivations || 'Unknown',
        secrets: data.secrets || '',
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        hitPoints: 10,
        armorClass: 10,
      },
      quests: [],
      relationships: [],
    };
  }

  private convertToQuest(data: any): Quest {
    return {
      id: generateId(),
      campaignId: '',
      title: data.title || 'Untitled Quest',
      description: data.description || '',
      importance: data.importance || 'medium',
      status: 'active',
      startNpcId: '',
      involvedNpcIds: [],
      locationIds: [],
      rewards: data.rewards || 'XP and gold',
      notes: data.notes || '',
    };
  }

  private convertToLocation(data: any): EnhancedLocation {
    return {
      id: generateId(),
      campaignId: '',
      name: data.name || 'Unknown Location',
      type: data.type || 'city',
      coords: data.coords || { lat: 0, lng: 0 },
      description: data.description || '',
      detailedDescription: data.description || '',

      // Hierarchical structure
      parentLocationId: undefined,
      subLocations: [],
      hierarchyLevel: 3,

      // Enhanced data
      geography: {
        terrain: 'Mixed',
        topography: 'Varied',
        naturalFeatures: [],
        climateZone: data.climate || 'Temperate',
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
        governmentType: data.government || 'Local council',
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
        economicStatus: data.economy || 'Moderate'
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
        temperatureRange: data.climate || 'Moderate',
        seasons: ['Spring', 'Summer', 'Autumn', 'Winter'],
        precipitation: 'Regular',
        weatherEvents: []
      },

      // Story elements
      history: data.history || '',
      legends: [],
      rumors: Array.isArray(data.rumors) ? data.rumors : [],
      secrets: Array.isArray(data.secrets) ? data.secrets : [],
      notableFeatures: [],
      magicalProperties: [],

      // Population and size
      population: data.population || 0,
      size: 'medium',

      // Associated entities
      npcs: [],
      quests: [],
      images: [],

      // Metadata
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private calculateNPCCount(length: string): number {
    switch (length) {
      case 'short': return 8;
      case 'medium': return 12;
      case 'long': return 16;
      default: return 10;
    }
  }

  private calculateQuestCount(length: string): number {
    switch (length) {
      case 'short': return 6;
      case 'medium': return 10;
      case 'long': return 15;
      default: return 8;
    }
  }

  private calculateLocationCount(length: string): number {
    switch (length) {
      case 'short': return 6;
      case 'medium': return 10;
      case 'long': return 14;
      default: return 8;
    }
  }

  private generateMapSeed(title: string): string {
    return `${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
  }
}

// Export singleton instance
export const enhancedAI = new EnhancedAIService();
