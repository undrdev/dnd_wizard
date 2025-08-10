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

// Enhanced Location interface for AGENT 4
export interface EnhancedLocation extends Location {
  parentLocationId?: string;
  subLocations: string[]; // Child location IDs
  images: LocationImage[];
  detailedDescription: string;
  history: string;
  rumors: string[];
  secrets: string[];
  climate: string;
  population?: number;
  government?: string;
  economy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LocationImage {
  id: string;
  url: string;
  caption: string;
  isPrimary: boolean;
  uploadedAt: Date;
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

// Enhanced Quest interface for Agent 3
export interface EnhancedQuest extends Quest {
  dependencies: string[]; // Quest IDs that must be completed first
  milestones: QuestMilestone[];
  xpReward: number;
  goldReward: number;
  itemRewards: string[];
  completedAt?: Date;
  playerNotes: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuestMilestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: Date;
  order: number;
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

// Enhanced UI and State Types
export interface MapState {
  center: [number, number];
  zoom: number;
  selectedNpc?: string;
  selectedQuest?: string;
  selectedLocation?: string;
  layers: MapLayer[];
  annotations: MapAnnotation[];
  drawingMode: DrawingMode;
  activeLayer?: string;
  measurementMode: boolean;
  clusteringEnabled: boolean;
  currentTheme: MapTheme;
}

export type DrawingMode = 'none' | 'line' | 'polygon' | 'circle' | 'rectangle' | 'text';

export interface MapTheme {
  id: string;
  name: string;
  baseLayer: string;
  markerStyle: MarkerStyleConfig;
}

export interface MarkerStyleConfig {
  npc: MarkerStyle;
  quest: MarkerStyle;
  location: MarkerStyle;
}

export interface MarkerStyle {
  color: string;
  size: number;
  icon: string;
  clusterColor?: string;
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

// Map Export Types
export interface MapExportOptions {
  format: 'png' | 'jpg' | 'pdf';
  quality: number;
  includeAnnotations: boolean;
  includeLayers: string[];
  width: number;
  height: number;
}

// Measurement Types
export interface MeasurementResult {
  type: 'distance' | 'area';
  value: number;
  unit: string;
  coordinates: LatLng[];
}

// API Types
export interface AICommandRequest {
  command: string;
  campaignId: string;
  context?: any; // Allow any context format for flexibility
}

export interface AICommandResponse {
  success: boolean;
  data?: {
    npcs?: NPC[];
    quests?: Quest[];
    locations?: Location[];
    suggestions?: string[];
    followUpQuestions?: string[];
    message?: string;
  };
  error?: string;
  command?: {
    type: string;
    confidence: number;
    parameters: Record<string, any>;
  };
}

export interface CampaignExport {
  version: string;
  exportedAt: Date;
  campaign: Campaign;
  locations: Location[];
  npcs: NPC[];
  quests: Quest[];
  aiContext: AIContextMemory;
  metadata: {
    totalItems: number;
    checksum: string;
  };
}

// Import/Export operation types
export interface ExportProgress {
  stage: 'gathering' | 'processing' | 'generating' | 'complete';
  progress: number; // 0-100
  message: string;
  totalItems?: number;
  processedItems?: number;
}

export interface ImportProgress {
  stage: 'validating' | 'processing' | 'resolving-conflicts' | 'importing' | 'complete';
  progress: number; // 0-100
  message: string;
  totalItems?: number;
  processedItems?: number;
}

export interface ImportResult {
  success: boolean;
  imported: {
    campaign: boolean;
    locations: number;
    npcs: number;
    quests: number;
    aiContext: boolean;
  };
  conflicts: ImportConflict[];
  errors: string[];
}

export interface ImportConflict {
  type: 'campaign' | 'location' | 'npc' | 'quest';
  id: string;
  name: string;
  action: 'skip' | 'overwrite' | 'rename';
  existingItem?: any;
  newItem?: any;
}

export interface ImportOptions {
  overwriteExisting: boolean;
  resolveConflicts: 'skip' | 'overwrite' | 'rename' | 'ask';
  importAIContext: boolean;
}

// Enhanced Map Layer Types
export interface MapLayer {
  id: string;
  name: string;
  type: 'terrain' | 'political' | 'custom' | 'annotations';
  visible: boolean;
  opacity: number;
  minZoom?: number;
  maxZoom?: number;
  data?: any;
  url?: string;
}

export interface MapAnnotation {
  id: string;
  campaignId: string;
  type: 'line' | 'polygon' | 'circle' | 'text' | 'rectangle';
  coordinates: LatLng[];
  style: AnnotationStyle;
  label?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnnotationStyle {
  color: string;
  fillColor?: string;
  weight: number;
  opacity: number;
  fillOpacity?: number;
  dashArray?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface TerrainLayer extends MapLayer {
  type: 'terrain';
  terrainType: 'topographic' | 'satellite' | 'hybrid' | 'physical';
}

export interface BiomeLayer extends MapLayer {
  type: 'custom';
  biomeType: 'forest' | 'desert' | 'mountain' | 'ocean' | 'grassland' | 'tundra';
  geoJsonData?: any;
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

// Enhanced Quest Form Data for Agent 3
export interface EnhancedQuestFormData {
  title: string;
  description: string;
  importance: Quest['importance'];
  status: Quest['status'];
  startNpcId: string;
  involvedNpcIds: string[];
  locationIds: string[];
  dependencies: string[];
  milestones: Omit<QuestMilestone, 'id'>[];
  xpReward: number;
  goldReward: number;
  itemRewards: string[];
  rewards?: string;
  notes?: string;
  playerNotes: string;
}

// Quest Filter and Search Types
export interface QuestFilters {
  status?: Quest['status'][];
  importance?: Quest['importance'][];
  involvedNpcIds?: string[];
  locationIds?: string[];
  hasRewards?: boolean;
  hasDependencies?: boolean;
  completedDateRange?: {
    start?: Date;
    end?: Date;
  };
}

export interface QuestSearchOptions {
  query?: string;
  filters?: QuestFilters;
  sortBy?: 'title' | 'importance' | 'status' | 'createdAt' | 'completedAt' | 'progress';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Quest Progress and Timeline Types
export interface QuestProgress {
  questId: string;
  totalMilestones: number;
  completedMilestones: number;
  percentage: number;
  canComplete: boolean; // Based on dependencies
}

export interface QuestTimelineEvent {
  id: string;
  questId: string;
  type: 'created' | 'milestone_completed' | 'status_changed' | 'dependency_added' | 'completed';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
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
export type CreateEnhancedQuestData = Omit<EnhancedQuest, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateEnhancedLocationData = Omit<EnhancedLocation, 'id' | 'createdAt' | 'updatedAt'>;

// Location-specific types for AGENT 4
export interface LocationFilterCriteria {
  type?: Location['type'][];
  parentLocationId?: string;
  hasSubLocations?: boolean;
  hasImages?: boolean;
  populationRange?: {
    min?: number;
    max?: number;
  };
  climate?: string[];
}

export type LocationSortBy =
  | 'name'
  | 'type'
  | 'population'
  | 'createdAt'
  | 'updatedAt'
  | 'subLocationCount';

export interface LocationHierarchyNode {
  location: EnhancedLocation;
  children: LocationHierarchyNode[];
  depth: number;
}

export interface LocationFormData {
  name: string;
  type: Location['type'];
  coords: {
    lat: number;
    lng: number;
  };
  description: string;
  detailedDescription: string;
  history: string;
  rumors: string[];
  secrets: string[];
  climate: string;
  population?: number;
  government?: string;
  economy?: string;
  parentLocationId?: string;
}
