import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  QueryConstraint,
  DocumentData,
  serverTimestamp,
  enableNetwork,
  disableNetwork,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  RealtimeService,
  RealtimeSubscription,
  ConnectionState,
  OptimisticUpdate,
  ConflictResolution,
} from '@/types';

class RealtimeServiceImpl implements RealtimeService {
  private subscriptions = new Map<string, RealtimeSubscription>();
  private connectionState: ConnectionState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isConnected: false,
    retryCount: 0,
  };
  private optimisticUpdates = new Map<string, OptimisticUpdate>();
  private connectionListeners = new Set<(state: ConnectionState) => void>();
  private retryTimeouts = new Map<string, NodeJS.Timeout>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeConnectionMonitoring();
    }
  }

  private initializeConnectionMonitoring() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.updateConnectionState({ isOnline: true });
      this.retryFailedOperations();
    });

    window.addEventListener('offline', () => {
      this.updateConnectionState({ isOnline: false, isConnected: false });
    });

    // Monitor Firestore connection state
    this.monitorFirestoreConnection();
  }

  private monitorFirestoreConnection() {
    // Create a minimal subscription to monitor connection
    const unsubscribe = onSnapshot(
      doc(db, '_connection_test', 'test'),
      () => {
        this.updateConnectionState({ 
          isConnected: true, 
          lastConnected: new Date(),
          retryCount: 0,
          error: undefined 
        });
      },
      (error) => {
        console.warn('Firestore connection error:', error);
        this.updateConnectionState({ 
          isConnected: false,
          error: error.message 
        });
      }
    );

    // Store the unsubscribe function
    this.subscriptions.set('_connection_monitor', {
      id: '_connection_monitor',
      collection: '_connection_test',
      callback: () => {},
      unsubscribe,
    });
  }

  private updateConnectionState(updates: Partial<ConnectionState>) {
    this.connectionState = { ...this.connectionState, ...updates };
    this.connectionListeners.forEach(listener => listener(this.connectionState));
  }

  public onConnectionStateChange(callback: (state: ConnectionState) => void): () => void {
    this.connectionListeners.add(callback);
    // Immediately call with current state
    callback(this.connectionState);
    
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  public getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  subscribeToCollection<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    filters: QueryConstraint[] = []
  ): () => void {
    const subscriptionId = `${collectionName}_${Date.now()}_${Math.random()}`;
    
    try {
      const collectionRef = collection(db, collectionName);
      const q = filters.length > 0 ? query(collectionRef, ...filters) : collectionRef;

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];
          
          callback(data);
        },
        (error) => {
          console.error(`Error in subscription ${subscriptionId}:`, error);
          this.updateConnectionState({ 
            isConnected: false,
            error: error.message 
          });
        }
      );

      const subscription: RealtimeSubscription = {
        id: subscriptionId,
        collection: collectionName,
        filters,
        callback,
        unsubscribe,
      };

      this.subscriptions.set(subscriptionId, subscription);

      return () => {
        unsubscribe();
        this.subscriptions.delete(subscriptionId);
      };
    } catch (error) {
      console.error(`Failed to create subscription for ${collectionName}:`, error);
      throw error;
    }
  }

  async updateWithOptimism<T>(
    collectionName: string,
    id: string,
    updates: Partial<T>
  ): Promise<void> {
    const optimisticId = `${collectionName}_${id}_${Date.now()}`;
    
    // Create optimistic update record
    const optimisticUpdate: OptimisticUpdate = {
      id: optimisticId,
      collection: collectionName,
      operation: 'update',
      data: updates as any,
      timestamp: new Date(),
      retryCount: 0,
    };

    this.optimisticUpdates.set(optimisticId, optimisticUpdate);

    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      // Remove optimistic update on success
      this.optimisticUpdates.delete(optimisticId);
    } catch (error) {
      console.error(`Optimistic update failed for ${collectionName}/${id}:`, error);
      
      // Update the optimistic record with error
      optimisticUpdate.error = error instanceof Error ? error.message : 'Unknown error';
      optimisticUpdate.retryCount++;
      
      if (!this.connectionState.isOnline) {
        // Queue for retry when online
        this.scheduleRetry(optimisticId);
      } else {
        // Remove failed update if online (likely a permission or validation error)
        this.optimisticUpdates.delete(optimisticId);
      }
      
      throw error;
    }
  }

  async createWithOptimism<T>(
    collectionName: string,
    data: T
  ): Promise<string> {
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const optimisticId = `${collectionName}_${tempId}_create`;
    
    const optimisticUpdate: OptimisticUpdate = {
      id: optimisticId,
      collection: collectionName,
      operation: 'create',
      data: data as any,
      timestamp: new Date(),
      retryCount: 0,
    };

    this.optimisticUpdates.set(optimisticId, optimisticUpdate);

    try {
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Remove optimistic update on success
      this.optimisticUpdates.delete(optimisticId);
      
      return docRef.id;
    } catch (error) {
      console.error(`Optimistic create failed for ${collectionName}:`, error);
      
      optimisticUpdate.error = error instanceof Error ? error.message : 'Unknown error';
      optimisticUpdate.retryCount++;
      
      if (!this.connectionState.isOnline) {
        this.scheduleRetry(optimisticId);
      } else {
        this.optimisticUpdates.delete(optimisticId);
      }
      
      throw error;
    }
  }

  async deleteWithOptimism(
    collectionName: string,
    id: string
  ): Promise<void> {
    const optimisticId = `${collectionName}_${id}_delete`;
    
    const optimisticUpdate: OptimisticUpdate = {
      id: optimisticId,
      collection: collectionName,
      operation: 'delete',
      data: { id },
      timestamp: new Date(),
      retryCount: 0,
    };

    this.optimisticUpdates.set(optimisticId, optimisticUpdate);

    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);

      this.optimisticUpdates.delete(optimisticId);
    } catch (error) {
      console.error(`Optimistic delete failed for ${collectionName}/${id}:`, error);
      
      optimisticUpdate.error = error instanceof Error ? error.message : 'Unknown error';
      optimisticUpdate.retryCount++;
      
      if (!this.connectionState.isOnline) {
        this.scheduleRetry(optimisticId);
      } else {
        this.optimisticUpdates.delete(optimisticId);
      }
      
      throw error;
    }
  }

  private scheduleRetry(optimisticId: string) {
    // Clear existing timeout
    const existingTimeout = this.retryTimeouts.get(optimisticId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule retry with exponential backoff
    const update = this.optimisticUpdates.get(optimisticId);
    if (!update) return;

    const delay = Math.min(1000 * Math.pow(2, update.retryCount), 30000); // Max 30 seconds
    
    const timeout = setTimeout(() => {
      this.retryOptimisticUpdate(optimisticId);
    }, delay);

    this.retryTimeouts.set(optimisticId, timeout);
  }

  private async retryOptimisticUpdate(optimisticId: string) {
    const update = this.optimisticUpdates.get(optimisticId);
    if (!update || !this.connectionState.isOnline) return;

    try {
      switch (update.operation) {
        case 'create':
          await this.createWithOptimism(update.collection, update.data);
          break;
        case 'update':
          // For updates, we need the document ID from the data
          const docId = (update.data as any).id;
          if (docId) {
            await this.updateWithOptimism(update.collection, docId, update.data);
          }
          break;
        case 'delete':
          const deleteId = (update.data as any).id;
          if (deleteId) {
            await this.deleteWithOptimism(update.collection, deleteId);
          }
          break;
      }
    } catch (error) {
      console.error(`Retry failed for ${optimisticId}:`, error);
      // The individual methods will handle retry scheduling
    }
  }

  private async retryFailedOperations() {
    const failedUpdates = Array.from(this.optimisticUpdates.values())
      .filter(update => update.error);

    for (const update of failedUpdates) {
      this.retryOptimisticUpdate(update.id);
    }
  }

  public getOptimisticUpdates(): OptimisticUpdate[] {
    return Array.from(this.optimisticUpdates.values());
  }

  public clearOptimisticUpdates() {
    this.optimisticUpdates.clear();
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
  }

  public unsubscribeAll() {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
    this.clearOptimisticUpdates();
  }
}

// Export singleton instance
export const realtimeService = new RealtimeServiceImpl();
