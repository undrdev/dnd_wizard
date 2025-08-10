import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { DEFAULT_MAP_THEMES } from '@/lib/mapThemes';
import type {
  AppState,
  Campaign,
  Location,
  NPC,
  Quest,
  User,
  MapState,
  MapLayer,
  MapAnnotation,
  DrawingMode,
  RealtimeAppState,
  ConnectionState,
  OfflineState,
  OptimisticUpdate,
  PerformanceMetrics,
} from '@/types';

interface AppStore extends RealtimeAppState {
  // Actions
  setUser: (user: User | null) => void;
  setCurrentCampaign: (campaign: Campaign | null) => void;
  setCampaigns: (campaigns: Campaign[]) => void;
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (campaignId: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (campaignId: string) => void;

  setLocations: (locations: Location[]) => void;
  addLocation: (location: Location) => void;
  updateLocation: (locationId: string, updates: Partial<Location>) => void;
  deleteLocation: (locationId: string) => void;

  setNPCs: (npcs: NPC[]) => void;
  addNPC: (npc: NPC) => void;
  updateNPC: (npcId: string, updates: Partial<NPC>) => void;
  deleteNPC: (npcId: string) => void;

  setQuests: (quests: Quest[]) => void;
  addQuest: (quest: Quest) => void;
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
  deleteQuest: (questId: string) => void;

  setMapState: (mapState: Partial<MapState>) => void;
  selectNPC: (npcId: string | undefined) => void;
  selectQuest: (questId: string | undefined) => void;
  selectLocation: (locationId: string | undefined) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Real-time and offline actions
  setConnectionState: (state: ConnectionState) => void;
  setOfflineState: (state: OfflineState) => void;
  addOptimisticUpdate: (update: OptimisticUpdate) => void;
  removeOptimisticUpdate: (updateId: string) => void;
  clearOptimisticUpdates: () => void;
  setPerformanceMetrics: (metrics: PerformanceMetrics) => void;

  // Computed getters
  getCurrentCampaignData: () => {
    campaign: Campaign | null;
    locations: Location[];
    npcs: NPC[];
    quests: Quest[];
  };

  getSelectedNPC: () => NPC | undefined;
  getSelectedQuest: () => Quest | undefined;
  getSelectedLocation: () => Location | undefined;

  // Utility actions
  reset: () => void;
  loadCampaignData: (data: {
    campaign: Campaign;
    locations: Location[];
    npcs: NPC[];
    quests: Quest[];
  }) => void;
  refreshCampaignData: () => Promise<void>;
}

const initialState: RealtimeAppState = {
  user: null,
  currentCampaign: null,
  campaigns: [],
  locations: [],
  npcs: [],
  quests: [],
  mapState: {
    center: [0, 0],
    zoom: 2,
    selectedNpc: undefined,
    selectedQuest: undefined,
    selectedLocation: undefined,
    layers: [],
    annotations: [],
    drawingMode: 'none',
    activeLayer: undefined,
    measurementMode: false,
    clusteringEnabled: true,
    currentTheme: DEFAULT_MAP_THEMES[0],
  },
  isLoading: false,
  error: null,
  connectionState: {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isConnected: false,
    retryCount: 0,
  },
  offlineState: {
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    pendingOperations: [],
    syncInProgress: false,
    storageQuota: { used: 0, available: 0 },
  },
  optimisticUpdates: [],
  performanceMetrics: undefined,
};

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // User actions
        setUser: (user) => set({ user }),

        // Campaign actions
        setCurrentCampaign: (campaign) => set({ currentCampaign: campaign }),
        setCampaigns: (campaigns) => set({ campaigns }),
        addCampaign: (campaign) =>
          set((state) => ({ campaigns: [...state.campaigns, campaign] })),
        updateCampaign: (campaignId, updates) =>
          set((state) => ({
            campaigns: state.campaigns.map((c) =>
              c.id === campaignId ? { ...c, ...updates } : c
            ),
            currentCampaign:
              state.currentCampaign?.id === campaignId
                ? { ...state.currentCampaign, ...updates }
                : state.currentCampaign,
          })),
        deleteCampaign: (campaignId) =>
          set((state) => ({
            campaigns: state.campaigns.filter((c) => c.id !== campaignId),
            currentCampaign:
              state.currentCampaign?.id === campaignId
                ? null
                : state.currentCampaign,
          })),

        // Location actions
        setLocations: (locations) => set({ locations }),
        addLocation: (location) =>
          set((state) => ({ locations: [...state.locations, location] })),
        updateLocation: (locationId, updates) =>
          set((state) => ({
            locations: state.locations.map((l) =>
              l.id === locationId ? { ...l, ...updates } : l
            ),
          })),
        deleteLocation: (locationId) =>
          set((state) => ({
            locations: state.locations.filter((l) => l.id !== locationId),
          })),

        // NPC actions
        setNPCs: (npcs) => set({ npcs }),
        addNPC: (npc) => set((state) => ({ npcs: [...state.npcs, npc] })),
        updateNPC: (npcId, updates) =>
          set((state) => ({
            npcs: state.npcs.map((n) =>
              n.id === npcId ? { ...n, ...updates } : n
            ),
          })),
        deleteNPC: (npcId) =>
          set((state) => ({
            npcs: state.npcs.filter((n) => n.id !== npcId),
          })),

        // Quest actions
        setQuests: (quests) => set({ quests }),
        addQuest: (quest) =>
          set((state) => ({ quests: [...state.quests, quest] })),
        updateQuest: (questId, updates) =>
          set((state) => ({
            quests: state.quests.map((q) =>
              q.id === questId ? { ...q, ...updates } : q
            ),
          })),
        deleteQuest: (questId) =>
          set((state) => ({
            quests: state.quests.filter((q) => q.id !== questId),
          })),

        // Map actions
        setMapState: (mapState) =>
          set((state) => ({
            mapState: { ...state.mapState, ...mapState },
          })),
        selectNPC: (npcId) =>
          set((state) => ({
            mapState: {
              ...state.mapState,
              selectedNpc: npcId,
              selectedQuest: undefined,
              selectedLocation: undefined,
            },
          })),
        selectQuest: (questId) =>
          set((state) => ({
            mapState: {
              ...state.mapState,
              selectedQuest: questId,
              selectedNpc: undefined,
              selectedLocation: undefined,
            },
          })),
        selectLocation: (locationId) =>
          set((state) => ({
            mapState: {
              ...state.mapState,
              selectedLocation: locationId,
              selectedNpc: undefined,
              selectedQuest: undefined,
            },
          })),

        // Loading and error actions
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        // Real-time and offline actions
        setConnectionState: (connectionState) => set({ connectionState }),
        setOfflineState: (offlineState) => set({ offlineState }),
        addOptimisticUpdate: (update) =>
          set((state) => ({
            optimisticUpdates: [...state.optimisticUpdates, update],
          })),
        removeOptimisticUpdate: (updateId) =>
          set((state) => ({
            optimisticUpdates: state.optimisticUpdates.filter(
              (update) => update.id !== updateId
            ),
          })),
        clearOptimisticUpdates: () => set({ optimisticUpdates: [] }),
        setPerformanceMetrics: (performanceMetrics) => set({ performanceMetrics }),

        // Computed getters
        getCurrentCampaignData: () => {
          const state = get();
          return {
            campaign: state.currentCampaign,
            locations: state.locations.filter(
              (l) => l.campaignId === state.currentCampaign?.id
            ),
            npcs: state.npcs.filter(
              (n) => n.campaignId === state.currentCampaign?.id
            ),
            quests: state.quests.filter(
              (q) => q.campaignId === state.currentCampaign?.id
            ),
          };
        },

        getSelectedNPC: () => {
          const state = get();
          return state.npcs.find((n) => n.id === state.mapState.selectedNpc);
        },

        getSelectedQuest: () => {
          const state = get();
          return state.quests.find((q) => q.id === state.mapState.selectedQuest);
        },

        getSelectedLocation: () => {
          const state = get();
          return state.locations.find(
            (l) => l.id === state.mapState.selectedLocation
          );
        },

        // Utility actions
        reset: () => set(initialState),
        loadCampaignData: (data) =>
          set({
            currentCampaign: data.campaign,
            locations: data.locations,
            npcs: data.npcs,
            quests: data.quests,
          }),
        refreshCampaignData: async () => {
          const state = get();
          if (!state.currentCampaign) return;

          try {
            // Import Firestore services dynamically to avoid SSR issues
            const { CampaignService, LocationService, NPCService, QuestService } = await import('@/lib/firestore');

            // Fetch fresh data from Firestore
            const [locations, npcs, quests] = await Promise.all([
              LocationService.getCampaignLocations(state.currentCampaign.id),
              NPCService.getCampaignNPCs(state.currentCampaign.id),
              QuestService.getCampaignQuests(state.currentCampaign.id),
            ]);

            // Update store with fresh data
            set({
              locations,
              npcs,
              quests,
            });
          } catch (error) {
            console.error('Failed to refresh campaign data:', error);
            set({ error: 'Failed to refresh campaign data' });
          }
        },
      }),
      {
        name: 'dnd-wizard-store',
        partialize: (state) => ({
          user: state.user,
          currentCampaign: state.currentCampaign,
          campaigns: state.campaigns,
          mapState: state.mapState,
        }),
      }
    ),
    { name: 'DnD Wizard Store' }
  )
);
