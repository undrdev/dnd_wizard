import React, { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { realtimeService } from '@/lib/realtime';
import { offlineManager } from '@/lib/offline';
import { performanceMonitor } from '@/lib/performance';
import { serviceWorkerManager } from '@/lib/serviceWorker';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const {
    user,
    currentCampaign,
    setConnectionState,
    setOfflineState,
    addOptimisticUpdate,
    removeOptimisticUpdate,
    setPerformanceMetrics,
    setCampaigns,
    setLocations,
    setNPCs,
    setQuests,
  } = useAppStore();

  const subscriptionsRef = useRef<(() => void)[]>([]);

  // Initialize real-time services
  useEffect(() => {
    // Initialize performance monitoring
    const latestMetrics = performanceMonitor.getLatestMetrics();
    if (latestMetrics) {
      setPerformanceMetrics(latestMetrics);
    }

    // Initialize service worker
    if (typeof window !== 'undefined') {
      serviceWorkerManager.register().catch(console.error);
    }

    return () => {
      // Cleanup on unmount
      subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
      subscriptionsRef.current = [];
      realtimeService.unsubscribeAll();
      performanceMonitor.destroy();
      offlineManager.destroy();
    };
  }, [setPerformanceMetrics]);

  // Monitor connection state
  useEffect(() => {
    const unsubscribeConnection = realtimeService.onConnectionStateChange(setConnectionState);
    const unsubscribeOffline = offlineManager.onStateChange(setOfflineState);

    subscriptionsRef.current.push(unsubscribeConnection, unsubscribeOffline);

    return () => {
      unsubscribeConnection();
      unsubscribeOffline();
    };
  }, [setConnectionState, setOfflineState]);

  // Monitor optimistic updates
  useEffect(() => {
    const interval = setInterval(() => {
      const updates = realtimeService.getOptimisticUpdates();
      // This is a simplified approach - in a real app you'd want more sophisticated state management
      updates.forEach(update => {
        if (!update.error) {
          addOptimisticUpdate(update);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [addOptimisticUpdate]);

  // Subscribe to user's campaigns when authenticated
  useEffect(() => {
    if (!user) {
      // Clear subscriptions when user logs out
      subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
      subscriptionsRef.current = [];
      return;
    }

    const unsubscribeCampaigns = realtimeService.subscribeToCollection(
      'campaigns',
      setCampaigns,
      [
        // Add where clause for user's campaigns
        // This would be implemented in the realtime service
      ]
    );

    subscriptionsRef.current.push(unsubscribeCampaigns);

    return () => {
      unsubscribeCampaigns();
    };
  }, [user, setCampaigns]);

  // Subscribe to current campaign data
  useEffect(() => {
    if (!currentCampaign) {
      return;
    }

    const unsubscribeLocations = realtimeService.subscribeToCollection(
      'locations',
      setLocations,
      [
        // Add where clause for campaign locations
        // This would be implemented in the realtime service
      ]
    );

    const unsubscribeNPCs = realtimeService.subscribeToCollection(
      'npcs',
      setNPCs,
      [
        // Add where clause for campaign NPCs
        // This would be implemented in the realtime service
      ]
    );

    const unsubscribeQuests = realtimeService.subscribeToCollection(
      'quests',
      setQuests,
      [
        // Add where clause for campaign quests
        // This would be implemented in the realtime service
      ]
    );

    subscriptionsRef.current.push(
      unsubscribeLocations,
      unsubscribeNPCs,
      unsubscribeQuests
    );

    return () => {
      unsubscribeLocations();
      unsubscribeNPCs();
      unsubscribeQuests();
    };
  }, [currentCampaign, setLocations, setNPCs, setQuests]);

  // Handle service worker events
  useEffect(() => {
    const handleSWUpdateAvailable = () => {
      console.log('Service Worker update available');
      // You could show a notification to the user here
    };

    const handleSWReady = () => {
      console.log('Service Worker ready for offline use');
    };

    const handleSWError = (event: CustomEvent) => {
      console.error('Service Worker error:', event.detail.error);
    };

    const handleSyncComplete = () => {
      console.log('Background sync completed');
      // Refresh optimistic updates
      removeOptimisticUpdate('all');
    };

    const handleSyncFailed = (event: CustomEvent) => {
      console.error('Background sync failed:', event.detail.error);
    };

    window.addEventListener('sw-update-available', handleSWUpdateAvailable);
    window.addEventListener('sw-ready', handleSWReady);
    window.addEventListener('sw-error', handleSWError as EventListener);
    window.addEventListener('sw-sync-complete', handleSyncComplete);
    window.addEventListener('sw-sync-failed', handleSyncFailed as EventListener);

    return () => {
      window.removeEventListener('sw-update-available', handleSWUpdateAvailable);
      window.removeEventListener('sw-ready', handleSWReady);
      window.removeEventListener('sw-error', handleSWError as EventListener);
      window.removeEventListener('sw-sync-complete', handleSyncComplete);
      window.removeEventListener('sw-sync-failed', handleSyncFailed as EventListener);
    };
  }, [removeOptimisticUpdate]);

  // Performance monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      const metrics = performanceMonitor.getLatestMetrics();
      if (metrics) {
        setPerformanceMetrics(metrics);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [setPerformanceMetrics]);

  return (
    <>
      {children}
      <ConnectionStatus position="top-right" showDetails={false} />
    </>
  );
}

// Hook for accessing real-time features
export function useRealtimeFeatures() {
  const {
    connectionState,
    offlineState,
    optimisticUpdates,
    performanceMetrics,
  } = useAppStore();

  return {
    connectionState,
    offlineState,
    optimisticUpdates,
    performanceMetrics,
    isOnline: connectionState.isOnline,
    isConnected: connectionState.isConnected,
    isOffline: offlineState.isOffline,
    hasPendingOperations: offlineState.pendingOperations.length > 0,
    syncInProgress: offlineState.syncInProgress,
  };
}
