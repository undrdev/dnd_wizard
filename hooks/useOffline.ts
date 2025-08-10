import { useState, useEffect, useCallback } from 'react';
import { offlineManager } from '@/lib/offline';
import type { OfflineState, OfflineOperation } from '@/types';

// Main offline state hook
export function useOffline() {
  const [offlineState, setOfflineState] = useState<OfflineState>(
    offlineManager.getState()
  );

  useEffect(() => {
    const unsubscribe = offlineManager.onStateChange(setOfflineState);
    return unsubscribe;
  }, []);

  const queueOperation = useCallback(async (
    operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>
  ) => {
    return offlineManager.queueOperation(operation);
  }, []);

  const clearPendingOperations = useCallback(async () => {
    return offlineManager.clearPendingOperations();
  }, []);

  const getStorageUsage = useCallback(async () => {
    return offlineManager.getStorageUsage();
  }, []);

  return {
    ...offlineState,
    queueOperation,
    clearPendingOperations,
    getStorageUsage,
  };
}

// Hook for offline-aware CRUD operations
export function useOfflineCRUD() {
  const { isOffline, queueOperation } = useOffline();

  const createOffline = useCallback(async (
    collection: string,
    data: any
  ): Promise<string> => {
    if (isOffline) {
      const tempId = `temp_${Date.now()}_${Math.random()}`;
      await queueOperation({
        type: 'create',
        collection,
        data: { ...data, id: tempId },
      });
      return tempId;
    }
    
    // If online, this would typically call the real-time service
    throw new Error('Online operations should use real-time service');
  }, [isOffline, queueOperation]);

  const updateOffline = useCallback(async (
    collection: string,
    documentId: string,
    updates: any
  ): Promise<void> => {
    if (isOffline) {
      await queueOperation({
        type: 'update',
        collection,
        documentId,
        data: updates,
      });
      return;
    }
    
    throw new Error('Online operations should use real-time service');
  }, [isOffline, queueOperation]);

  const deleteOffline = useCallback(async (
    collection: string,
    documentId: string
  ): Promise<void> => {
    if (isOffline) {
      await queueOperation({
        type: 'delete',
        collection,
        documentId,
        data: { id: documentId },
      });
      return;
    }
    
    throw new Error('Online operations should use real-time service');
  }, [isOffline, queueOperation]);

  return {
    isOffline,
    createOffline,
    updateOffline,
    deleteOffline,
  };
}

// Hook for offline-aware campaign operations
export function useOfflineCampaignOperations() {
  const { createOffline, updateOffline, deleteOffline } = useOfflineCRUD();

  const createCampaignOffline = useCallback(async (data: any) => {
    return createOffline('campaigns', data);
  }, [createOffline]);

  const updateCampaignOffline = useCallback(async (id: string, updates: any) => {
    return updateOffline('campaigns', id, updates);
  }, [updateOffline]);

  const deleteCampaignOffline = useCallback(async (id: string) => {
    return deleteOffline('campaigns', id);
  }, [deleteOffline]);

  const createLocationOffline = useCallback(async (data: any) => {
    return createOffline('locations', data);
  }, [createOffline]);

  const updateLocationOffline = useCallback(async (id: string, updates: any) => {
    return updateOffline('locations', id, updates);
  }, [updateOffline]);

  const deleteLocationOffline = useCallback(async (id: string) => {
    return deleteOffline('locations', id);
  }, [deleteOffline]);

  const createNPCOffline = useCallback(async (data: any) => {
    return createOffline('npcs', data);
  }, [createOffline]);

  const updateNPCOffline = useCallback(async (id: string, updates: any) => {
    return updateOffline('npcs', id, updates);
  }, [updateOffline]);

  const deleteNPCOffline = useCallback(async (id: string) => {
    return deleteOffline('npcs', id);
  }, [deleteOffline]);

  const createQuestOffline = useCallback(async (data: any) => {
    return createOffline('quests', data);
  }, [createOffline]);

  const updateQuestOffline = useCallback(async (id: string, updates: any) => {
    return updateOffline('quests', id, updates);
  }, [updateOffline]);

  const deleteQuestOffline = useCallback(async (id: string) => {
    return deleteOffline('quests', id);
  }, [deleteOffline]);

  return {
    // Campaigns
    createCampaignOffline,
    updateCampaignOffline,
    deleteCampaignOffline,
    
    // Locations
    createLocationOffline,
    updateLocationOffline,
    deleteLocationOffline,
    
    // NPCs
    createNPCOffline,
    updateNPCOffline,
    deleteNPCOffline,
    
    // Quests
    createQuestOffline,
    updateQuestOffline,
    deleteQuestOffline,
  };
}

// Hook for storage management
export function useOfflineStorage() {
  const [storageInfo, setStorageInfo] = useState<{
    used: number;
    available: number;
  }>({ used: 0, available: 0 });

  const updateStorageInfo = useCallback(async () => {
    try {
      const info = await offlineManager.getStorageUsage();
      setStorageInfo(info);
    } catch (error) {
      console.error('Failed to get storage info:', error);
    }
  }, []);

  useEffect(() => {
    updateStorageInfo();
    
    // Update storage info periodically
    const interval = setInterval(updateStorageInfo, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [updateStorageInfo]);

  const clearStorage = useCallback(async () => {
    try {
      await offlineManager.clearPendingOperations();
      await updateStorageInfo();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }, [updateStorageInfo]);

  const getStoragePercentage = useCallback(() => {
    const total = storageInfo.used + storageInfo.available;
    return total > 0 ? (storageInfo.used / total) * 100 : 0;
  }, [storageInfo]);

  const formatStorageSize = useCallback((bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }, []);

  return {
    storageInfo,
    updateStorageInfo,
    clearStorage,
    getStoragePercentage,
    formatStorageSize,
  };
}

// Hook for network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection.effectiveType || 'unknown');
      
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown');
      };
      
      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    connectionType,
  };
}

// Hook for offline-first data management
export function useOfflineFirst<T>(
  key: string,
  fetchOnline: () => Promise<T>,
  defaultValue: T
) {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOffline } = useOffline();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isOffline) {
        // Try to load from offline storage
        const offlineData = await offlineManager.getState();
        // This would typically retrieve cached data
        setData(defaultValue);
      } else {
        // Load from online source
        const onlineData = await fetchOnline();
        setData(onlineData);
        
        // Cache the data for offline use
        // This would typically store in IndexedDB
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setData(defaultValue);
    } finally {
      setLoading(false);
    }
  }, [key, fetchOnline, defaultValue, isOffline]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refresh,
    isOffline,
  };
}
