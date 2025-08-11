import { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { NPCService } from '@/lib/firestore';
import type { EnhancedNPC, NPCRelationship, Location } from '@/types';
import {
  enhanceNPC,
  validateNPCData,
  validateRelationship,
  filterNPCsBySearch,
  filterNPCsByCriteria,
  sortNPCs,
  createRelationship,
  type NPCFilterCriteria,
  type NPCSortBy,
} from '@/lib/npcUtils';

export interface UseNPCsReturn {
  // Data
  npcs: EnhancedNPC[];
  filteredNPCs: EnhancedNPC[];
  selectedNPC: EnhancedNPC | undefined;
  
  // Search and filter state
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterCriteria: NPCFilterCriteria;
  setFilterCriteria: (criteria: NPCFilterCriteria) => void;
  sortBy: NPCSortBy;
  setSortBy: (sortBy: NPCSortBy) => void;
  sortAscending: boolean;
  setSortAscending: (ascending: boolean) => void;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Actions
  createNPC: (data: Partial<EnhancedNPC>) => Promise<string | null>;
  updateNPC: (id: string, data: Partial<EnhancedNPC>) => Promise<boolean>;
  deleteNPC: (id: string) => Promise<boolean>;
  bulkDeleteNPCs: (ids: string[]) => Promise<boolean>;
  
  // Relationship actions
  addRelationship: (npcId: string, relationship: Omit<NPCRelationship, 'id' | 'createdAt'>) => Promise<boolean>;
  updateRelationship: (npcId: string, relationshipId: string, data: Partial<NPCRelationship>) => Promise<boolean>;
  removeRelationship: (npcId: string, relationshipId: string) => Promise<boolean>;
  
  // Utility functions
  getNPCsByLocation: (locationId: string) => EnhancedNPC[];
  getRelatedNPCs: (npcId: string) => EnhancedNPC[];
  clearFilters: () => void;
  refreshNPCs: () => Promise<void>;
}

export function useNPCs(): UseNPCsReturn {
  const {
    npcs: storeNPCs,
    currentCampaign,
    addNPC,
    updateNPC: updateStoreNPC,
    deleteNPC: deleteStoreNPC,
    getSelectedNPC,
    setLoading,
    setError,
  } = useAppStore();

  // Local state for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCriteria, setFilterCriteria] = useState<NPCFilterCriteria>({});
  const [sortBy, setSortBy] = useState<NPCSortBy>('name');
  const [sortAscending, setSortAscending] = useState(true);
  
  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Convert store NPCs to enhanced NPCs
  const npcs = useMemo(() => {
    if (!currentCampaign) return [];
    return storeNPCs
      .filter(npc => npc.campaignId === currentCampaign.id)
      .map(enhanceNPC);
  }, [storeNPCs, currentCampaign]);

  // Apply search, filter, and sort
  const filteredNPCs = useMemo(() => {
    let result = filterNPCsBySearch(npcs, searchTerm);
    result = filterNPCsByCriteria(result, filterCriteria);
    result = sortNPCs(result, sortBy, sortAscending);
    return result;
  }, [npcs, searchTerm, filterCriteria, sortBy, sortAscending]);

  const selectedNPC = useMemo(() => {
    const selected = getSelectedNPC();
    return selected ? enhanceNPC(selected) : undefined;
  }, [getSelectedNPC]);

  // Create new NPC
  const createNPC = useCallback(async (data: Partial<EnhancedNPC>): Promise<string | null> => {
    if (!currentCampaign) {
      setError('No active campaign');
      return null;
    }

    const errors = validateNPCData(data);
    if (errors.length > 0) {
      setError(errors.join(', '));
      return null;
    }

    setIsCreating(true);
    try {
      const npcData = {
        campaignId: currentCampaign.id,
        name: data.name!,
        role: data.role!,
        locationId: data.locationId!,
        personality: data.personality || '',
        stats: data.stats || {},
        quests: data.quests || [],
        portraitUrl: data.portraitUrl,
        relationships: data.relationships || [],
        notes: data.notes || '',
        backstory: data.backstory || '',
        goals: data.goals || [],
        secrets: data.secrets || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const npcId = await NPCService.createNPC(npcData);
      addNPC({ id: npcId, ...npcData });
      return npcId;
    } catch (error) {
      console.error('Error creating NPC:', error);
      setError('Failed to create NPC');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [currentCampaign, addNPC, setError]);

  // Update existing NPC
  const updateNPC = useCallback(async (id: string, data: Partial<EnhancedNPC>): Promise<boolean> => {
    const errors = validateNPCData(data);
    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }

    setIsUpdating(true);
    try {
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      await NPCService.updateNPC(id, updateData);
      updateStoreNPC(id, updateData);
      return true;
    } catch (error) {
      console.error('Error updating NPC:', error);
      setError('Failed to update NPC');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [updateStoreNPC, setError]);

  // Delete NPC
  const deleteNPC = useCallback(async (id: string): Promise<boolean> => {
    setIsDeleting(true);
    try {
      await NPCService.deleteNPC(id);
      deleteStoreNPC(id);
      return true;
    } catch (error) {
      console.error('Error deleting NPC:', error);
      setError('Failed to delete NPC');
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [deleteStoreNPC, setError]);

  // Bulk delete NPCs
  const bulkDeleteNPCs = useCallback(async (ids: string[]): Promise<boolean> => {
    setIsDeleting(true);
    try {
      await Promise.all(ids.map(id => NPCService.deleteNPC(id)));
      ids.forEach(id => deleteStoreNPC(id));
      return true;
    } catch (error) {
      console.error('Error bulk deleting NPCs:', error);
      setError('Failed to delete NPCs');
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [deleteStoreNPC, setError]);

  // Add relationship to NPC
  const addRelationship = useCallback(async (
    npcId: string,
    relationshipData: Omit<NPCRelationship, 'id' | 'createdAt'>
  ): Promise<boolean> => {
    const errors = validateRelationship(relationshipData, npcs);
    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }

    const npc = npcs.find(n => n.id === npcId);
    if (!npc) {
      setError('NPC not found');
      return false;
    }

    const relationship = createRelationship(
      relationshipData.toNpcId,
      relationshipData.relationshipType,
      relationshipData.strength,
      relationshipData.description,
      npcId
    );

    // TODO: Store relationship in a separate relationships store
    // For now, just store the relationship ID in the NPC's relationships array
    const updatedRelationships = [...(npc.relationships || []), relationship.id];
    return updateNPC(npcId, { relationships: updatedRelationships });
  }, [npcs, updateNPC, setError]);

  // Update relationship - TODO: Implement with relationship store
  const updateRelationship = useCallback(async (
    npcId: string,
    relationshipId: string,
    data: Partial<NPCRelationship>
  ): Promise<boolean> => {
    // TODO: Update relationship in separate relationship store
    console.log('Update relationship not yet implemented with new relationship system');
    return false;
  }, []);

  // Remove relationship
  const removeRelationship = useCallback(async (
    npcId: string,
    relationshipId: string
  ): Promise<boolean> => {
    const npc = npcs.find(n => n.id === npcId);
    if (!npc) {
      setError('NPC not found');
      return false;
    }

    // Remove relationship ID from NPC's relationships array
    const updatedRelationships = (npc.relationships || []).filter(id => id !== relationshipId);
    return updateNPC(npcId, { relationships: updatedRelationships });
  }, [npcs, updateNPC, setError]);

  // Get NPCs by location
  const getNPCsByLocation = useCallback((locationId: string): EnhancedNPC[] => {
    return npcs.filter(npc => npc.locationId === locationId);
  }, [npcs]);

  // Get related NPCs
  const getRelatedNPCs = useCallback((npcId: string): EnhancedNPC[] => {
    const npc = npcs.find(n => n.id === npcId);
    if (!npc) return [];

    // TODO: Update with new relationship system - relationships are now just IDs
    // const relatedIds = npc.relationships.map(rel => rel.toNpcId);
    // return npcs.filter(n => relatedIds.includes(n.id));
    return []; // Temporary until relationship system is fully implemented
  }, [npcs]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterCriteria({});
    setSortBy('name');
    setSortAscending(true);
  }, []);

  // Refresh NPCs from server
  const refreshNPCs = useCallback(async () => {
    if (!currentCampaign) return;

    setLoading(true);
    try {
      // This would typically refetch from the server
      // For now, we'll just clear any local errors
      setError(null);
    } catch (error) {
      console.error('Error refreshing NPCs:', error);
      setError('Failed to refresh NPCs');
    } finally {
      setLoading(false);
    }
  }, [currentCampaign, setLoading, setError]);

  return {
    // Data
    npcs,
    filteredNPCs,
    selectedNPC,
    
    // Search and filter state
    searchTerm,
    setSearchTerm,
    filterCriteria,
    setFilterCriteria,
    sortBy,
    setSortBy,
    sortAscending,
    setSortAscending,
    
    // Loading states
    isLoading: false, // This would come from the store
    isCreating,
    isUpdating,
    isDeleting,
    
    // Actions
    createNPC,
    updateNPC,
    deleteNPC,
    bulkDeleteNPCs,
    
    // Relationship actions
    addRelationship,
    updateRelationship,
    removeRelationship,
    
    // Utility functions
    getNPCsByLocation,
    getRelatedNPCs,
    clearFilters,
    refreshNPCs,
  };
}
