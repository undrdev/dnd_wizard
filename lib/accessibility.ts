/**
 * Accessibility utilities and services for the DnD Wizard application
 * Provides screen reader support, focus management, and WCAG compliance utilities
 */

// Types for accessibility features
export interface AccessibilityPreferences {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderEnabled: boolean;
  keyboardNavigation: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
}

export interface FocusTrapOptions {
  initialFocus?: HTMLElement | string;
  fallbackFocus?: HTMLElement | string;
  escapeDeactivates?: boolean;
  clickOutsideDeactivates?: boolean;
}

// Screen reader announcement service
class ScreenReaderService {
  private liveRegion: HTMLElement | null = null;

  constructor() {
    this.createLiveRegion();
  }

  private createLiveRegion(): void {
    if (typeof window === 'undefined') return;

    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.setAttribute('aria-relevant', 'text');
    this.liveRegion.style.position = 'absolute';
    this.liveRegion.style.left = '-10000px';
    this.liveRegion.style.width = '1px';
    this.liveRegion.style.height = '1px';
    this.liveRegion.style.overflow = 'hidden';
    document.body.appendChild(this.liveRegion);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;

    // Clear after announcement to allow repeated messages
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = '';
      }
    }, 1000);
  }
}

// Focus management utilities
export class FocusManager {
  private static focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableSelectors))
      .filter(el => this.isVisible(el)) as HTMLElement[];
  }

  static isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }

  static createFocusTrap(container: HTMLElement, options: FocusTrapOptions = {}): () => void {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return () => {};

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Set initial focus
    if (options.initialFocus) {
      const initialElement = typeof options.initialFocus === 'string' 
        ? container.querySelector(options.initialFocus) as HTMLElement
        : options.initialFocus;
      initialElement?.focus();
    } else {
      firstElement.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }

      if (e.key === 'Escape' && options.escapeDeactivates !== false) {
        deactivate();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (options.clickOutsideDeactivates && !container.contains(e.target as Node)) {
        deactivate();
      }
    };

    const deactivate = () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
      
      // Return focus to fallback element if specified
      if (options.fallbackFocus) {
        const fallbackElement = typeof options.fallbackFocus === 'string'
          ? document.querySelector(options.fallbackFocus) as HTMLElement
          : options.fallbackFocus;
        fallbackElement?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    if (options.clickOutsideDeactivates) {
      document.addEventListener('click', handleClickOutside);
    }

    return deactivate;
  }
}

// Color contrast utilities
export class ColorContrastChecker {
  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  static getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;

    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  static meetsWCAGAA(foreground: string, background: string, isLargeText = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  }

  static meetsWCAGAAA(foreground: string, background: string, isLargeText = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
}

// Main accessibility service
export class AccessibilityService {
  private screenReader: ScreenReaderService;
  private preferences: AccessibilityPreferences;

  constructor() {
    this.screenReader = new ScreenReaderService();
    this.preferences = this.loadPreferences();
    this.applyPreferences();
  }

  announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.screenReader.announce(message, priority);
  }

  setFocusTrap(element: HTMLElement, options?: FocusTrapOptions): () => void {
    return FocusManager.createFocusTrap(element, options);
  }

  checkColorContrast(foreground: string, background: string): boolean {
    return ColorContrastChecker.meetsWCAGAA(foreground, background);
  }

  enableHighContrast(): void {
    this.preferences.highContrast = true;
    this.savePreferences();
    this.applyPreferences();
    document.documentElement.classList.add('high-contrast');
  }

  disableHighContrast(): void {
    this.preferences.highContrast = false;
    this.savePreferences();
    this.applyPreferences();
    document.documentElement.classList.remove('high-contrast');
  }

  setReducedMotion(enabled: boolean): void {
    this.preferences.reducedMotion = enabled;
    this.savePreferences();
    this.applyPreferences();
  }

  setFontSize(size: AccessibilityPreferences['fontSize']): void {
    this.preferences.fontSize = size;
    this.savePreferences();
    this.applyPreferences();
  }

  getPreferences(): AccessibilityPreferences {
    return { ...this.preferences };
  }

  private loadPreferences(): AccessibilityPreferences {
    if (typeof window === 'undefined') {
      return this.getDefaultPreferences();
    }

    try {
      const stored = localStorage.getItem('accessibility-preferences');
      return stored ? JSON.parse(stored) : this.getDefaultPreferences();
    } catch {
      return this.getDefaultPreferences();
    }
  }

  private savePreferences(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('accessibility-preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to save accessibility preferences:', error);
    }
  }

  private getDefaultPreferences(): AccessibilityPreferences {
    return {
      highContrast: false,
      reducedMotion: false,
      screenReaderEnabled: false,
      keyboardNavigation: true,
      fontSize: 'medium'
    };
  }

  private applyPreferences(): void {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    // Apply high contrast
    root.classList.toggle('high-contrast', this.preferences.highContrast);
    
    // Apply reduced motion
    root.classList.toggle('reduce-motion', this.preferences.reducedMotion);
    
    // Apply font size
    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
    root.classList.add(`font-${this.preferences.fontSize}`);
  }
}

// Export singleton instance
export const accessibilityService = new AccessibilityService();
