import { create } from 'zustand';
import { NPCRelationship, RelationshipType } from '@/types';

interface RelationshipState {
  relationships: NPCRelationship[];
  loading: boolean;
  error: string | null;
}

interface RelationshipActions {
  // State management
  setRelationships: (relationships: NPCRelationship[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // CRUD operations
  addRelationship: (relationship: NPCRelationship) => void;
  updateRelationship: (id: string, updates: Partial<NPCRelationship>) => void;
  removeRelationship: (id: string) => void;
  
  // Query operations
  getRelationshipsByNPC: (npcId: string) => NPCRelationship[];
  getRelationshipBetween: (npc1Id: string, npc2Id: string) => NPCRelationship[];
  getRelationshipsByType: (npcId: string, type: RelationshipType) => NPCRelationship[];
  
  // Utility operations
  clearAll: () => void;
}

export const useRelationshipStore = create<RelationshipState & RelationshipActions>((set, get) => ({
  // Initial state
  relationships: [],
  loading: false,
  error: null,

  // State management
  setRelationships: (relationships) => set({ relationships }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // CRUD operations
  addRelationship: (relationship) => 
    set((state) => ({ 
      relationships: [...state.relationships, relationship] 
    })),

  updateRelationship: (id, updates) =>
    set((state) => ({
      relationships: state.relationships.map(rel =>
        rel.id === id ? { ...rel, ...updates, updatedAt: new Date() } : rel
      )
    })),

  removeRelationship: (id) =>
    set((state) => ({
      relationships: state.relationships.filter(rel => rel.id !== id)
    })),

  // Query operations
  getRelationshipsByNPC: (npcId) => {
    const { relationships } = get();
    return relationships.filter(rel => 
      rel.fromNpcId === npcId || rel.toNpcId === npcId
    );
  },

  getRelationshipBetween: (npc1Id, npc2Id) => {
    const { relationships } = get();
    return relationships.filter(rel =>
      (rel.fromNpcId === npc1Id && rel.toNpcId === npc2Id) ||
      (rel.fromNpcId === npc2Id && rel.toNpcId === npc1Id)
    );
  },

  getRelationshipsByType: (npcId, type) => {
    const { relationships } = get();
    return relationships.filter(rel =>
      (rel.fromNpcId === npcId || rel.toNpcId === npcId) &&
      rel.relationshipType === type
    );
  },

  // Utility operations
  clearAll: () => set({ relationships: [], loading: false, error: null }),
}));
