import type { PerformanceMetrics, PerformanceConfig } from '@/types';

class PerformanceMonitor {
  private config: PerformanceConfig = {
    enableMonitoring: true,
    sampleRate: 0.1, // Monitor 10% of sessions
    reportInterval: 30000, // Report every 30 seconds
    thresholds: {
      loadTime: 3000, // 3 seconds
      renderTime: 100, // 100ms
      memoryUsage: 50 * 1024 * 1024, // 50MB
    },
  };

  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];
  private reportTimer?: NodeJS.Timeout;

  constructor(config?: Partial<PerformanceConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (typeof window !== 'undefined' && this.shouldMonitor()) {
      this.initialize();
    }
  }

  private shouldMonitor(): boolean {
    return (
      this.config.enableMonitoring &&
      typeof window !== 'undefined' &&
      Math.random() < this.config.sampleRate
    );
  }

  private initialize() {
    this.setupPerformanceObservers();
    this.startReporting();
    this.monitorPageLoad();
  }

  private setupPerformanceObservers() {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    // Monitor navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
          }
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    } catch (error) {
      console.warn('Failed to setup navigation observer:', error);
    }

    // Monitor paint timing
    try {
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.recordPaintMetrics(entry);
          }
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);
    } catch (error) {
      console.warn('Failed to setup paint observer:', error);
    }

    // Monitor largest contentful paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.recordLCPMetrics(lastEntry);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (error) {
      console.warn('Failed to setup LCP observer:', error);
    }

    // Monitor layout shifts
    try {
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordLayoutShift(entry as any);
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      console.warn('Failed to setup CLS observer:', error);
    }
  }

  private recordNavigationMetrics(entry: PerformanceNavigationTiming) {
    const loadTime = entry.loadEventEnd - entry.fetchStart;
    const renderTime = entry.domContentLoadedEventEnd - entry.fetchStart;

    this.addMetric({
      loadTime,
      renderTime,
      memoryUsage: this.getMemoryUsage(),
      networkLatency: entry.responseStart - entry.requestStart,
      cacheHitRate: 0, // Will be calculated separately
      timestamp: new Date(),
    });
  }

  private recordPaintMetrics(entry: PerformanceEntry) {
    console.log('First Contentful Paint:', entry.startTime);
  }

  private recordLCPMetrics(entry: PerformanceEntry) {
    console.log('Largest Contentful Paint:', entry.startTime);
  }

  private recordLayoutShift(entry: any) {
    if (!entry.hadRecentInput) {
      console.log('Layout Shift:', entry.value);
    }
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  private monitorPageLoad() {
    if (document.readyState === 'complete') {
      this.recordPageLoadMetrics();
    } else {
      window.addEventListener('load', () => {
        this.recordPageLoadMetrics();
      });
    }
  }

  private recordPageLoadMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.recordNavigationMetrics(navigation);
    }
  }

  private addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Check thresholds and warn if exceeded
    this.checkThresholds(metric);
    
    // Keep only recent metrics (last 100)
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  private checkThresholds(metric: PerformanceMetrics) {
    const { thresholds } = this.config;
    
    if (metric.loadTime > thresholds.loadTime) {
      console.warn(`Load time threshold exceeded: ${metric.loadTime}ms > ${thresholds.loadTime}ms`);
    }
    
    if (metric.renderTime > thresholds.renderTime) {
      console.warn(`Render time threshold exceeded: ${metric.renderTime}ms > ${thresholds.renderTime}ms`);
    }
    
    if (metric.memoryUsage > thresholds.memoryUsage) {
      console.warn(`Memory usage threshold exceeded: ${metric.memoryUsage} bytes > ${thresholds.memoryUsage} bytes`);
    }
  }

  private startReporting() {
    this.reportTimer = setInterval(() => {
      this.reportMetrics();
    }, this.config.reportInterval);
  }

  private reportMetrics() {
    if (this.metrics.length === 0) return;

    const recentMetrics = this.metrics.slice(-10); // Last 10 metrics
    const avgMetrics = this.calculateAverageMetrics(recentMetrics);
    
    console.log('Performance Report:', avgMetrics);
    
    // In a real application, you might send this to an analytics service
    // this.sendToAnalytics(avgMetrics);
  }

  private calculateAverageMetrics(metrics: PerformanceMetrics[]): PerformanceMetrics {
    if (metrics.length === 0) {
      return {
        loadTime: 0,
        renderTime: 0,
        memoryUsage: 0,
        networkLatency: 0,
        cacheHitRate: 0,
        timestamp: new Date(),
      };
    }

    const totals = metrics.reduce(
      (acc, metric) => ({
        loadTime: acc.loadTime + metric.loadTime,
        renderTime: acc.renderTime + metric.renderTime,
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
        networkLatency: acc.networkLatency + metric.networkLatency,
        cacheHitRate: acc.cacheHitRate + metric.cacheHitRate,
      }),
      { loadTime: 0, renderTime: 0, memoryUsage: 0, networkLatency: 0, cacheHitRate: 0 }
    );

    return {
      loadTime: totals.loadTime / metrics.length,
      renderTime: totals.renderTime / metrics.length,
      memoryUsage: totals.memoryUsage / metrics.length,
      networkLatency: totals.networkLatency / metrics.length,
      cacheHitRate: totals.cacheHitRate / metrics.length,
      timestamp: new Date(),
    };
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  public clearMetrics() {
    this.metrics = [];
  }

  public updateConfig(config: Partial<PerformanceConfig>) {
    this.config = { ...this.config, ...config };
  }

  public destroy() {
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    // Clear timer
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = undefined;
    }
    
    // Clear metrics
    this.clearMetrics();
  }
}

// Utility functions for performance monitoring
export function measureAsync<T>(
  name: string,
  asyncFn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  return asyncFn().finally(() => {
    const duration = performance.now() - start;
    console.log(`${name} took ${duration.toFixed(2)}ms`);
  });
}

export function measureSync<T>(
  name: string,
  syncFn: () => T
): T {
  const start = performance.now();
  const result = syncFn();
  const duration = performance.now() - start;
  console.log(`${name} took ${duration.toFixed(2)}ms`);
  return result;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Web Vitals measurement
export function measureWebVitals() {
  // This would typically use the web-vitals library
  // For now, we'll use basic performance API
  
  if ('PerformanceObserver' in window) {
    // Measure FCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          console.log('FCP:', entry.startTime);
        }
      });
    }).observe({ entryTypes: ['paint'] });

    // Measure LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Measure CLS
    let clsValue = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      console.log('CLS:', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }
}
