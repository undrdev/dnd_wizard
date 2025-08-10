// Service Worker registration and management utilities

interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private config: ServiceWorkerConfig = {};

  constructor(config: ServiceWorkerConfig = {}) {
    this.config = config;
  }

  async register(swUrl: string = '/sw.js'): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register(swUrl);
      this.registration = registration;

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available
              console.log('New content is available; please refresh.');
              this.config.onUpdate?.(registration);
            } else {
              // Content is cached for offline use
              console.log('Content is cached for offline use.');
              this.config.onSuccess?.(registration);
            }
          }
        });
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', this.handleMessage.bind(this));

      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      this.config.onError?.(error as Error);
    }
  }

  private handleMessage(event: MessageEvent) {
    const { type, data } = event.data;

    switch (type) {
      case 'SYNC_COMPLETE':
        console.log('Background sync completed');
        // Notify the app that sync is complete
        window.dispatchEvent(new CustomEvent('sw-sync-complete', { detail: data }));
        break;

      case 'SYNC_FAILED':
        console.error('Background sync failed:', data.error);
        window.dispatchEvent(new CustomEvent('sw-sync-failed', { detail: data }));
        break;

      default:
        console.log('Unknown service worker message:', type, data);
    }
  }

  async unregister(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      return registration.unregister();
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  async update(): Promise<void> {
    if (!this.registration) {
      console.warn('No service worker registration found');
      return;
    }

    try {
      await this.registration.update();
      console.log('Service Worker update check completed');
    } catch (error) {
      console.error('Service Worker update failed:', error);
    }
  }

  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) {
      console.warn('No waiting service worker found');
      return;
    }

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  async cacheUrls(urls: string[]): Promise<void> {
    if (!this.registration?.active) {
      console.warn('No active service worker found');
      return;
    }

    this.registration.active.postMessage({
      type: 'CACHE_URLS',
      data: { urls },
    });
  }

  async clearCache(cacheName?: string): Promise<void> {
    if (!this.registration?.active) {
      console.warn('No active service worker found');
      return;
    }

    this.registration.active.postMessage({
      type: 'CLEAR_CACHE',
      data: { cacheName },
    });
  }

  async getCacheSize(): Promise<number> {
    if (!this.registration?.active) {
      console.warn('No active service worker found');
      return 0;
    }

    return new Promise((resolve) => {
      const channel = new MessageChannel();
      
      channel.port1.onmessage = (event) => {
        resolve(event.data.size || 0);
      };

      this.registration!.active!.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [channel.port2]
      );
    });
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  async getState(): Promise<string> {
    if (!this.registration) {
      return 'not-registered';
    }

    if (this.registration.installing) {
      return 'installing';
    }

    if (this.registration.waiting) {
      return 'waiting';
    }

    if (this.registration.active) {
      return 'active';
    }

    return 'unknown';
  }
}

// Background sync utilities
export function requestBackgroundSync(tag: string): void {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      return registration.sync.register(tag);
    }).catch((error) => {
      console.error('Background sync registration failed:', error);
    });
  } else {
    console.warn('Background sync not supported');
  }
}

// Push notification utilities
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration,
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey,
    });

    console.log('Push notification subscription successful');
    return subscription;
  } catch (error) {
    console.error('Push notification subscription failed:', error);
    return null;
  }
}

// Utility functions
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

export function isPushNotificationSupported(): boolean {
  return 'PushManager' in window && 'Notification' in window;
}

export function isBackgroundSyncSupported(): boolean {
  return 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
}

// Export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager({
  onUpdate: (registration) => {
    // Show update available notification
    window.dispatchEvent(new CustomEvent('sw-update-available', { 
      detail: { registration } 
    }));
  },
  onSuccess: (registration) => {
    // Show app ready for offline use notification
    window.dispatchEvent(new CustomEvent('sw-ready', { 
      detail: { registration } 
    }));
  },
  onError: (error) => {
    // Show service worker error notification
    window.dispatchEvent(new CustomEvent('sw-error', { 
      detail: { error } 
    }));
  },
});

// Auto-register service worker in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  serviceWorkerManager.register().catch(console.error);
}
