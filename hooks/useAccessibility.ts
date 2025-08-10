import { useState, useEffect, useCallback } from 'react';
import { accessibilityService, type AccessibilityPreferences } from '@/lib/accessibility';

interface UseAccessibilityReturn {
  // State
  preferences: AccessibilityPreferences;
  isHighContrast: boolean;
  isReducedMotion: boolean;
  fontSize: AccessibilityPreferences['fontSize'];
  
  // Actions
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  setFontSize: (size: AccessibilityPreferences['fontSize']) => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  createFocusTrap: (element: HTMLElement, options?: any) => () => void;
  checkColorContrast: (foreground: string, background: string) => boolean;
  
  // Utilities
  getAriaLabel: (base: string, context?: string) => string;
  getAriaDescribedBy: (id: string) => string;
  generateId: (prefix?: string) => string;
}

export function useAccessibility(): UseAccessibilityReturn {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(
    accessibilityService.getPreferences()
  );

  // Update preferences when they change
  useEffect(() => {
    const updatePreferences = () => {
      setPreferences(accessibilityService.getPreferences());
    };

    // Listen for preference changes (custom event)
    window.addEventListener('accessibility-preferences-changed', updatePreferences);
    
    return () => {
      window.removeEventListener('accessibility-preferences-changed', updatePreferences);
    };
  }, []);

  // Detect system preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches && !preferences.reducedMotion) {
        accessibilityService.setReducedMotion(true);
        setPreferences(accessibilityService.getPreferences());
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    
    // Check initial state
    if (mediaQuery.matches && !preferences.reducedMotion) {
      accessibilityService.setReducedMotion(true);
      setPreferences(accessibilityService.getPreferences());
    }

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preferences.reducedMotion]);

  const toggleHighContrast = useCallback(() => {
    if (preferences.highContrast) {
      accessibilityService.disableHighContrast();
    } else {
      accessibilityService.enableHighContrast();
    }
    setPreferences(accessibilityService.getPreferences());
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('accessibility-preferences-changed'));
  }, [preferences.highContrast]);

  const toggleReducedMotion = useCallback(() => {
    accessibilityService.setReducedMotion(!preferences.reducedMotion);
    setPreferences(accessibilityService.getPreferences());
    
    window.dispatchEvent(new CustomEvent('accessibility-preferences-changed'));
  }, [preferences.reducedMotion]);

  const setFontSize = useCallback((size: AccessibilityPreferences['fontSize']) => {
    accessibilityService.setFontSize(size);
    setPreferences(accessibilityService.getPreferences());
    
    window.dispatchEvent(new CustomEvent('accessibility-preferences-changed'));
  }, []);

  const announceToScreenReader = useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    accessibilityService.announceToScreenReader(message, priority);
  }, []);

  const createFocusTrap = useCallback((element: HTMLElement, options?: any) => {
    return accessibilityService.setFocusTrap(element, options);
  }, []);

  const checkColorContrast = useCallback((foreground: string, background: string) => {
    return accessibilityService.checkColorContrast(foreground, background);
  }, []);

  // Utility functions for ARIA attributes
  const getAriaLabel = useCallback((base: string, context?: string) => {
    if (context) {
      return `${base} - ${context}`;
    }
    return base;
  }, []);

  const getAriaDescribedBy = useCallback((id: string) => {
    return `${id}-description`;
  }, []);

  const generateId = useCallback((prefix = 'accessibility') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  return {
    // State
    preferences,
    isHighContrast: preferences.highContrast,
    isReducedMotion: preferences.reducedMotion,
    fontSize: preferences.fontSize,
    
    // Actions
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
    announceToScreenReader,
    createFocusTrap,
    checkColorContrast,
    
    // Utilities
    getAriaLabel,
    getAriaDescribedBy,
    generateId,
  };
}

// Hook for keyboard navigation
export function useKeyboardNavigation() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    let keyboardUsed = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !keyboardUsed) {
        keyboardUsed = true;
        setIsKeyboardUser(true);
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      if (keyboardUsed) {
        keyboardUsed = false;
        setIsKeyboardUser(false);
        document.body.classList.remove('keyboard-navigation');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return { isKeyboardUser };
}

// Hook for managing focus within a component
export function useFocusManagement(containerRef: React.RefObject<HTMLElement>) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);

  const updateFocusableElements = useCallback(() => {
    if (!containerRef.current) return;

    const elements = Array.from(
      containerRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    setFocusableElements(elements);
  }, [containerRef]);

  useEffect(() => {
    updateFocusableElements();
  }, [updateFocusableElements]);

  const focusNext = useCallback(() => {
    if (focusableElements.length === 0) return;
    
    const nextIndex = (focusedIndex + 1) % focusableElements.length;
    setFocusedIndex(nextIndex);
    focusableElements[nextIndex]?.focus();
  }, [focusableElements, focusedIndex]);

  const focusPrevious = useCallback(() => {
    if (focusableElements.length === 0) return;
    
    const prevIndex = focusedIndex <= 0 ? focusableElements.length - 1 : focusedIndex - 1;
    setFocusedIndex(prevIndex);
    focusableElements[prevIndex]?.focus();
  }, [focusableElements, focusedIndex]);

  const focusFirst = useCallback(() => {
    if (focusableElements.length === 0) return;
    
    setFocusedIndex(0);
    focusableElements[0]?.focus();
  }, [focusableElements]);

  const focusLast = useCallback(() => {
    if (focusableElements.length === 0) return;
    
    const lastIndex = focusableElements.length - 1;
    setFocusedIndex(lastIndex);
    focusableElements[lastIndex]?.focus();
  }, [focusableElements]);

  return {
    focusedIndex,
    focusableElements,
    updateFocusableElements,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
  };
}
