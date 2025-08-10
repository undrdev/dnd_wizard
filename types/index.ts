// Core data models based on technical specification

export interface Campaign {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  mapSeed: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  id: string;
  campaignId: string;
  name: string;
  type: 'city' | 'village' | 'landmark' | 'dungeon';
  coords: {
    lat: number;
    lng: number;
  };
  description: string;
  npcs: string[]; // NPC IDs
  quests: string[]; // Quest IDs
}

export interface NPC {
  id: string;
  campaignId: string;
  name: string;
  role: string;
  locationId: string;
  personality: string;
  stats: Record<string, any>;
  quests: string[]; // Quest IDs
  portraitUrl?: string;
}

// Enhanced NPC interface for AGENT 2
export interface EnhancedNPC extends NPC {
  relationships: NPCRelationship[];
  notes: string;
  backstory: string;
  goals: string[];
  secrets: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NPCRelationship {
  id: string;
  targetNpcId: string;
  type: 'ally' | 'enemy' | 'neutral' | 'romantic' | 'family' | 'business';
  strength: number; // 1-10
  description: string;
  createdAt: Date;
}

export interface Quest {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  importance: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'failed';
  startNpcId: string;
  involvedNpcIds: string[];
  locationIds: string[];
  rewards?: string;
  notes?: string;
}

export interface AIContextMemory {
  campaignId: string;
  tokens: string[];
  lastUpdated: Date;
  conversationHistory?: AIMessage[];
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// UI and State Types
export interface MapState {
  center: [number, number];
  zoom: number;
  selectedNpc?: string;
  selectedQuest?: string;
  selectedLocation?: string;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface AppState {
  user: User | null;
  currentCampaign: Campaign | null;
  campaigns: Campaign[];
  locations: Location[];
  npcs: NPC[];
  quests: Quest[];
  mapState: MapState;
  isLoading: boolean;
  error: string | null;
}

// API Types
export interface AICommandRequest {
  command: string;
  campaignId: string;
  context?: Partial<AIContextMemory>;
}

export interface AICommandResponse {
  success: boolean;
  data?: {
    npcs?: NPC[];
    quests?: Quest[];
    locations?: Location[];
    message?: string;
  };
  error?: string;
}

export interface CampaignExport {
  campaign: Campaign;
  locations: Location[];
  npcs: NPC[];
  quests: Quest[];
  aiContext: AIContextMemory;
  exportedAt: Date;
  version: string;
}

// Map Layer Types
export interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  minZoom?: number;
  maxZoom?: number;
}

export interface NPCMarker {
  npc: NPC;
  location: Location;
}

export interface QuestMarker {
  quest: Quest;
  locations: Location[];
}

// Form Types
export interface CampaignFormData {
  title: string;
  description: string;
  concept?: string;
  generateWithAI: boolean;
}

export interface NPCFormData {
  name: string;
  role: string;
  locationId: string;
  personality: string;
  stats: Record<string, any>;
}

export interface QuestFormData {
  title: string;
  description: string;
  importance: Quest['importance'];
  startNpcId: string;
  involvedNpcIds: string[];
  locationIds: string[];
  rewards?: string;
}

export interface LocationFormData {
  name: string;
  type: Location['type'];
  coords: {
    lat: number;
    lng: number;
  };
  description: string;
}

// API Provider Types
export interface AIProvider {
  name: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
}

export interface AIProviderConfig {
  openai?: {
    apiKey: string;
    model: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
  };
  anthropic?: {
    apiKey: string;
    model: 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku';
  };
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type CreateCampaignData = Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateLocationData = Omit<Location, 'id'>;
export type CreateNPCData = Omit<NPC, 'id'>;
export type CreateQuestData = Omit<Quest, 'id'>;
