import type {
  OfflineStorage,
  OfflineOperation,
  OfflineState,
} from '@/types';

class OfflineStorageImpl implements OfflineStorage {
  private dbName = 'dnd-wizard-offline';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initializeDB();
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('operations')) {
          const operationsStore = db.createObjectStore('operations', { keyPath: 'id' });
          operationsStore.createIndex('timestamp', 'timestamp');
          operationsStore.createIndex('collection', 'collection');
        }

        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (this.initPromise) {
      await this.initPromise;
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  async store<T>(key: string, data: T): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put({
        key,
        data,
        timestamp: Date.now(),
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async retrieve<T>(key: string): Promise<T | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['data'], 'readonly');
    const store = transaction.objectStore('data');
    
    return new Promise<T | null>((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async remove(key: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['data', 'operations', 'cache'], 'readwrite');
    
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('data').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('operations').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('cache').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
    ]);
  }

  async storeOperation(operation: OfflineOperation): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['operations'], 'readwrite');
    const store = transaction.objectStore('operations');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(operation);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getOperations(): Promise<OfflineOperation[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['operations'], 'readonly');
    const store = transaction.objectStore('operations');
    
    return new Promise<OfflineOperation[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async removeOperation(id: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['operations'], 'readwrite');
    const store = transaction.objectStore('operations');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async sync(): Promise<void> {
    // This would typically sync with the server
    // For now, we'll just clear old cache entries
    await this.cleanupCache();
  }

  private async cleanupCache(): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    const index = store.index('timestamp');
    
    // Remove cache entries older than 24 hours
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    const range = IDBKeyRange.upperBound(cutoff);
    
    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor(range);
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getStorageInfo(): Promise<{ used: number; available: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          available: (estimate.quota || 0) - (estimate.usage || 0),
        };
      } catch (error) {
        console.warn('Failed to get storage estimate:', error);
      }
    }
    
    // Fallback estimation
    return {
      used: 0,
      available: 50 * 1024 * 1024, // Assume 50MB available
    };
  }
}

class OfflineManager {
  private storage: OfflineStorageImpl;
  private state: OfflineState = {
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    pendingOperations: [],
    syncInProgress: false,
    storageQuota: { used: 0, available: 0 },
  };
  private listeners = new Set<(state: OfflineState) => void>();
  private syncTimer?: NodeJS.Timeout;

  constructor() {
    this.storage = new OfflineStorageImpl();
    if (typeof window !== 'undefined') {
      this.initializeOfflineHandling();
      this.loadPendingOperations();
      this.updateStorageInfo();
    }
  }

  private initializeOfflineHandling() {
    window.addEventListener('online', () => {
      this.updateState({ isOffline: false });
      this.syncPendingOperations();
    });

    window.addEventListener('offline', () => {
      this.updateState({ isOffline: true });
    });

    // Periodic sync when online
    this.syncTimer = setInterval(() => {
      if (!this.state.isOffline && this.state.pendingOperations.length > 0) {
        this.syncPendingOperations();
      }
    }, 30000); // Every 30 seconds
  }

  private updateState(updates: Partial<OfflineState>) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }

  private async loadPendingOperations() {
    try {
      const operations = await this.storage.getOperations();
      this.updateState({ pendingOperations: operations });
    } catch (error) {
      console.error('Failed to load pending operations:', error);
    }
  }

  private async updateStorageInfo() {
    try {
      const storageInfo = await this.storage.getStorageInfo();
      this.updateState({ storageQuota: storageInfo });
    } catch (error) {
      console.error('Failed to update storage info:', error);
    }
  }

  async queueOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const fullOperation: OfflineOperation = {
      ...operation,
      id: `${operation.type}_${operation.collection}_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      retryCount: 0,
    };

    try {
      await this.storage.storeOperation(fullOperation);
      this.updateState({
        pendingOperations: [...this.state.pendingOperations, fullOperation],
      });

      // Try to sync immediately if online
      if (!this.state.isOffline) {
        this.syncPendingOperations();
      }
    } catch (error) {
      console.error('Failed to queue operation:', error);
      throw error;
    }
  }

  private async syncPendingOperations() {
    if (this.state.syncInProgress || this.state.isOffline) {
      return;
    }

    this.updateState({ syncInProgress: true });

    try {
      const operations = [...this.state.pendingOperations];
      const successfulOperations: string[] = [];

      for (const operation of operations) {
        try {
          await this.executeOperation(operation);
          successfulOperations.push(operation.id);
          await this.storage.removeOperation(operation.id);
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);
          
          // Update retry count
          const updatedOperation = {
            ...operation,
            retryCount: operation.retryCount + 1,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          
          await this.storage.storeOperation(updatedOperation);
        }
      }

      // Update state with remaining operations
      const remainingOperations = this.state.pendingOperations.filter(
        op => !successfulOperations.includes(op.id)
      );

      this.updateState({ pendingOperations: remainingOperations });
    } finally {
      this.updateState({ syncInProgress: false });
    }
  }

  private async executeOperation(operation: OfflineOperation): Promise<void> {
    // This would typically make the actual API call
    // For now, we'll simulate the operation
    console.log(`Executing offline operation: ${operation.type} ${operation.collection}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
      throw new Error('Simulated network error');
    }
  }

  onStateChange(callback: (state: OfflineState) => void): () => void {
    this.listeners.add(callback);
    // Immediately call with current state
    callback(this.state);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  getState(): OfflineState {
    return { ...this.state };
  }

  async clearPendingOperations(): Promise<void> {
    try {
      const operations = [...this.state.pendingOperations];
      for (const operation of operations) {
        await this.storage.removeOperation(operation.id);
      }
      this.updateState({ pendingOperations: [] });
    } catch (error) {
      console.error('Failed to clear pending operations:', error);
      throw error;
    }
  }

  async getStorageUsage(): Promise<{ used: number; available: number }> {
    return this.storage.getStorageInfo();
  }

  destroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export const offlineManager = new OfflineManager();
export const offlineStorage = new OfflineStorageImpl();
