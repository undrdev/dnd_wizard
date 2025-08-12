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

// Enhanced Location Types for Hierarchical System
export type LocationType =
  | 'continent' | 'region'
  | 'country' | 'kingdom'
  | 'province' | 'state'
  | 'city' | 'town' | 'village'
  | 'district' | 'neighborhood'
  | 'building' | 'establishment'
  | 'river' | 'lake' | 'ocean' | 'mountain' | 'forest' | 'desert'
  | 'temple' | 'ruins' | 'monument' | 'bridge' | 'crossroads'
  | 'dungeon' | 'wilderness' | 'structure' | 'landmark';

export interface LocationGeography {
  terrain: string;
  topography: string;
  naturalFeatures: string[];
  climateZone: string;
  flora: string[];
  fauna: string[];
  naturalResources: string[];
  weatherPatterns: string;
  naturalDisasters: string[];
}

export interface LocationArchitecture {
  buildingStyles: string[];
  materials: string[];
  cityLayout: string;
  fortifications: string;
  notableBuildings: string[];
}

export interface LocationPolitics {
  governmentType: string;
  rulers: string[];
  laws: string[];
  conflicts: string[];
  alliances: string[];
  politicalStatus: string;
}

export interface LocationEconomy {
  tradeGoods: string[];
  currency: string;
  markets: string[];
  guilds: string[];
  industries: string[];
  economicStatus: string;
}

export interface LocationCulture {
  demographics: string[];
  languages: string[];
  customs: string[];
  festivals: string[];
  religions: string[];
  socialStructure: string;
}

export interface LocationClimate {
  temperatureRange: string;
  seasons: string[];
  precipitation: string;
  weatherEvents: string[];
}

// Enhanced Location interface for AGENT 4 - Hierarchical System
export interface EnhancedLocation {
  // Base properties (similar to Location but with expanded type)
  id: string;
  campaignId: string;
  name: string;
  type: LocationType;
  coords: {
    lat: number;
    lng: number;
  };
  description: string;
  npcs: string[]; // NPC IDs
  quests: string[]; // Quest IDs

  // Enhanced properties
  parentLocationId?: string;
  subLocations: string[]; // Child location IDs
  hierarchyLevel: number;
  images: LocationImage[];
  detailedDescription: string;

  // Detailed information
  geography: LocationGeography;
  architecture: LocationArchitecture;
  politics: LocationPolitics;
  economy: LocationEconomy;
  culture: LocationCulture;
  climate: LocationClimate;

  // Story elements
  history: string;
  legends: string[];
  rumors: string[];
  secrets: string[];
  notableFeatures: string[];
  magicalProperties: string[];

  // Population and size
  population?: number;
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'massive';

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

// NPC Relationship System
export type RelationshipType =
  | 'family' | 'spouse' | 'parent' | 'child' | 'sibling'
  | 'friend' | 'close_friend' | 'acquaintance'
  | 'enemy' | 'rival' | 'nemesis'
  | 'business_partner' | 'employer' | 'employee'
  | 'political_ally' | 'political_enemy'
  | 'mentor' | 'student' | 'colleague'
  | 'romantic_interest' | 'ex_lover'
  | 'guild_member' | 'religious_ally'
  | 'unknown' | 'neutral';

export interface NPCRelationship {
  id: string;
  fromNpcId: string;
  toNpcId: string;
  relationshipType: RelationshipType;
  strength: 'weak' | 'moderate' | 'strong' | 'intense';
  description: string;
  isPublic: boolean; // Whether this relationship is known publicly
  createdAt: Date;
  updatedAt: Date;
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
  relationships: string[]; // NPCRelationship IDs
}

// Enhanced NPC interface for AGENT 2
export interface EnhancedNPC extends NPC {
  notes: string;
  backstory: string;
  goals: string[];
  secrets: string[];
  createdAt?: Date;
  updatedAt?: Date;
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
  locations: EnhancedLocation[];
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
  type: LocationType;
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
    model: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-4-turbo-preview' | 'gpt-3.5-turbo' | 'gpt-3.5-turbo-16k';
  };
  anthropic?: {
    apiKey: string;
    model: 'claude-3-opus-20240229' | 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307';
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
  type?: LocationType[];
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

export interface EnhancedLocationFormData {
  name: string;
  type: LocationType;
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

// AGENT 7: Real-time Data Synchronization & Performance Types

// Real-time Service Types
export interface RealtimeSubscription {
  id: string;
  collection: string;
  filters?: any[];
  callback: (data: any[]) => void;
  unsubscribe: () => void;
}

export interface RealtimeService {
  subscribeToCollection<T>(
    collection: string,
    callback: (data: T[]) => void,
    filters?: any[]
  ): () => void;

  updateWithOptimism<T>(
    collection: string,
    id: string,
    updates: Partial<T>
  ): Promise<void>;

  createWithOptimism<T>(
    collection: string,
    data: T
  ): Promise<string>;

  deleteWithOptimism(
    collection: string,
    id: string
  ): Promise<void>;
}

// Connection State Types
export interface ConnectionState {
  isOnline: boolean;
  isConnected: boolean;
  lastConnected?: Date;
  retryCount: number;
  error?: string;
}

export interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'reconnecting' | 'error';
  message?: string;
  timestamp: Date;
}

// Optimistic Update Types
export interface OptimisticUpdate<T = any> {
  id: string;
  collection: string;
  operation: 'create' | 'update' | 'delete';
  data: T;
  originalData?: T;
  timestamp: Date;
  retryCount: number;
  error?: string;
}

export interface ConflictResolution {
  type: 'server-wins' | 'client-wins' | 'merge' | 'manual';
  serverData: any;
  clientData: any;
  resolvedData?: any;
}

// Performance Monitoring Types
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  cacheHitRate: number;
  timestamp: Date;
}

export interface PerformanceConfig {
  enableMonitoring: boolean;
  sampleRate: number;
  reportInterval: number;
  thresholds: {
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
  };
}

// Offline Support Types
export interface OfflineState {
  isOffline: boolean;
  lastSync?: Date;
  pendingOperations: OfflineOperation[];
  syncInProgress: boolean;
  storageQuota: {
    used: number;
    available: number;
  };
}

export interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId?: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  error?: string;
}

export interface OfflineStorage {
  store<T>(key: string, data: T): Promise<void>;
  retrieve<T>(key: string): Promise<T | null>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  sync(): Promise<void>;
  getStorageInfo(): Promise<{
    used: number;
    available: number;
  }>;
}

// Service Worker Types
export interface ServiceWorkerConfig {
  cacheName: string;
  version: string;
  staticAssets: string[];
  apiEndpoints: string[];
  offlinePages: string[];
}

export interface CacheStrategy {
  name: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  maxAge?: number;
  maxEntries?: number;
}

// Loading Skeleton Types
export interface SkeletonConfig {
  rows: number;
  columns?: number;
  height?: string;
  width?: string;
  borderRadius?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

// Enhanced App State for Real-time Features
export interface RealtimeAppState extends AppState {
  connectionState: ConnectionState;
  offlineState: OfflineState;
  optimisticUpdates: OptimisticUpdate[];
  performanceMetrics?: PerformanceMetrics;
}
