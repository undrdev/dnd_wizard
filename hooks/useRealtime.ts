import { useEffect, useState, useCallback, useRef } from 'react';
import { where, orderBy, QueryConstraint } from 'firebase/firestore';
import { realtimeService } from '@/lib/realtime';
import { useAppStore } from '@/stores/useAppStore';
import type {
  Campaign,
  Location,
  NPC,
  Quest,
  ConnectionState,
  OptimisticUpdate,
} from '@/types';

// Generic real-time collection hook
export function useRealtimeCollection<T>(
  collectionName: string,
  filters: QueryConstraint[] = [],
  enabled = true
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const unsubscribe = realtimeService.subscribeToCollection<T>(
        collectionName,
        (newData) => {
          setData(newData);
          setLoading(false);
        },
        filters
      );

      unsubscribeRef.current = unsubscribe;

      return () => {
        unsubscribe();
        unsubscribeRef.current = null;
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe to collection');
      setLoading(false);
    }
  }, [collectionName, enabled, JSON.stringify(filters)]);

  const refresh = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    setLoading(true);
    setError(null);
    
    const unsubscribe = realtimeService.subscribeToCollection<T>(
      collectionName,
      (newData) => {
        setData(newData);
        setLoading(false);
      },
      filters
    );
    
    unsubscribeRef.current = unsubscribe;
  }, [collectionName, JSON.stringify(filters)]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}

// Real-time campaigns hook
export function useRealtimeCampaigns(userId?: string) {
  const filters = userId ? [where('ownerId', '==', userId)] : [];
  
  return useRealtimeCollection<Campaign>(
    'campaigns',
    filters,
    !!userId
  );
}

// Real-time locations hook
export function useRealtimeLocations(campaignId?: string) {
  const filters = campaignId ? [
    where('campaignId', '==', campaignId),
    orderBy('name', 'asc')
  ] : [];
  
  return useRealtimeCollection<Location>(
    'locations',
    filters,
    !!campaignId
  );
}

// Real-time NPCs hook
export function useRealtimeNPCs(campaignId?: string) {
  const filters = campaignId ? [
    where('campaignId', '==', campaignId),
    orderBy('name', 'asc')
  ] : [];
  
  return useRealtimeCollection<NPC>(
    'npcs',
    filters,
    !!campaignId
  );
}

// Real-time quests hook
export function useRealtimeQuests(campaignId?: string) {
  const filters = campaignId ? [
    where('campaignId', '==', campaignId),
    orderBy('title', 'asc')
  ] : [];
  
  return useRealtimeCollection<Quest>(
    'quests',
    filters,
    !!campaignId
  );
}

// Connection state hook
export function useConnectionState() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    realtimeService.getConnectionState()
  );

  useEffect(() => {
    const unsubscribe = realtimeService.onConnectionStateChange(setConnectionState);
    return unsubscribe;
  }, []);

  return connectionState;
}

// Optimistic updates hook
export function useOptimisticUpdates() {
  const [optimisticUpdates, setOptimisticUpdates] = useState<OptimisticUpdate[]>([]);

  useEffect(() => {
    // Poll for optimistic updates (in a real app, you might want to use events)
    const interval = setInterval(() => {
      setOptimisticUpdates(realtimeService.getOptimisticUpdates());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const clearUpdates = useCallback(() => {
    realtimeService.clearOptimisticUpdates();
    setOptimisticUpdates([]);
  }, []);

  return {
    optimisticUpdates,
    clearUpdates,
  };
}

// Enhanced campaign data hook with real-time updates
export function useRealtimeCampaignData(campaignId?: string) {
  const { setLoading, setError } = useAppStore();
  
  const campaigns = useRealtimeCampaigns();
  const locations = useRealtimeLocations(campaignId);
  const npcs = useRealtimeNPCs(campaignId);
  const quests = useRealtimeQuests(campaignId);

  const loading = campaigns.loading || locations.loading || npcs.loading || quests.loading;
  const error = campaigns.error || locations.error || npcs.error || quests.error;

  // Update store loading state
  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  // Update store error state
  useEffect(() => {
    setError(error);
  }, [error, setError]);

  const currentCampaign = campaigns.data.find(c => c.id === campaignId);

  return {
    campaign: currentCampaign || null,
    campaigns: campaigns.data,
    locations: locations.data,
    npcs: npcs.data,
    quests: quests.data,
    loading,
    error,
    refresh: useCallback(() => {
      campaigns.refresh();
      locations.refresh();
      npcs.refresh();
      quests.refresh();
    }, [campaigns.refresh, locations.refresh, npcs.refresh, quests.refresh]),
  };
}

// Optimistic CRUD operations hooks
export function useOptimisticCRUD() {
  const createDocument = useCallback(async <T>(
    collection: string,
    data: T
  ): Promise<string> => {
    return realtimeService.createWithOptimism(collection, data);
  }, []);

  const updateDocument = useCallback(async <T>(
    collection: string,
    id: string,
    updates: Partial<T>
  ): Promise<void> => {
    return realtimeService.updateWithOptimism(collection, id, updates);
  }, []);

  const deleteDocument = useCallback(async (
    collection: string,
    id: string
  ): Promise<void> => {
    return realtimeService.deleteWithOptimism(collection, id);
  }, []);

  return {
    createDocument,
    updateDocument,
    deleteDocument,
  };
}

// Campaign-specific optimistic operations
export function useOptimisticCampaignOperations() {
  const { createDocument, updateDocument, deleteDocument } = useOptimisticCRUD();

  const createCampaign = useCallback(async (data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => {
    return createDocument('campaigns', data);
  }, [createDocument]);

  const updateCampaign = useCallback(async (id: string, updates: Partial<Campaign>) => {
    return updateDocument('campaigns', id, updates);
  }, [updateDocument]);

  const deleteCampaign = useCallback(async (id: string) => {
    return deleteDocument('campaigns', id);
  }, [deleteDocument]);

  const createLocation = useCallback(async (data: Omit<Location, 'id'>) => {
    return createDocument('locations', data);
  }, [createDocument]);

  const updateLocation = useCallback(async (id: string, updates: Partial<Location>) => {
    return updateDocument('locations', id, updates);
  }, [updateDocument]);

  const deleteLocation = useCallback(async (id: string) => {
    return deleteDocument('locations', id);
  }, [deleteDocument]);

  const createNPC = useCallback(async (data: Omit<NPC, 'id'>) => {
    return createDocument('npcs', data);
  }, [createDocument]);

  const updateNPC = useCallback(async (id: string, updates: Partial<NPC>) => {
    return updateDocument('npcs', id, updates);
  }, [updateDocument]);

  const deleteNPC = useCallback(async (id: string) => {
    return deleteDocument('npcs', id);
  }, [deleteDocument]);

  const createQuest = useCallback(async (data: Omit<Quest, 'id'>) => {
    return createDocument('quests', data);
  }, [createDocument]);

  const updateQuest = useCallback(async (id: string, updates: Partial<Quest>) => {
    return updateDocument('quests', id, updates);
  }, [updateDocument]);

  const deleteQuest = useCallback(async (id: string) => {
    return deleteDocument('quests', id);
  }, [deleteDocument]);

  return {
    // Campaigns
    createCampaign,
    updateCampaign,
    deleteCampaign,
    
    // Locations
    createLocation,
    updateLocation,
    deleteLocation,
    
    // NPCs
    createNPC,
    updateNPC,
    deleteNPC,
    
    // Quests
    createQuest,
    updateQuest,
    deleteQuest,
  };
}
