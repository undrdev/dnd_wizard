import { useState, useEffect, useCallback } from 'react';

interface MobileState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  orientation: 'portrait' | 'landscape';
  screenSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  viewportHeight: number;
  viewportWidth: number;
}

interface UseMobileReturn extends MobileState {
  // Actions
  enableHapticFeedback: () => void;
  optimizeForViewport: () => void;
  lockOrientation: (orientation: 'portrait' | 'landscape') => Promise<void>;
  unlockOrientation: () => void;
  
  // Utilities
  getTouchTargetSize: () => number;
  isLandscape: boolean;
  isPortrait: boolean;
  canVibrate: boolean;
}

// Breakpoints matching Tailwind CSS defaults
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export function useMobile(): UseMobileReturn {
  const [mobileState, setMobileState] = useState<MobileState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    orientation: 'landscape',
    screenSize: 'lg',
    viewportHeight: 0,
    viewportWidth: 0,
  });

  // Detect device capabilities and screen size
  const updateMobileState = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Determine screen size based on width
    let screenSize: MobileState['screenSize'] = 'sm';
    if (width >= BREAKPOINTS['2xl']) screenSize = '2xl';
    else if (width >= BREAKPOINTS.xl) screenSize = 'xl';
    else if (width >= BREAKPOINTS.lg) screenSize = 'lg';
    else if (width >= BREAKPOINTS.md) screenSize = 'md';
    else screenSize = 'sm';

    // Determine device type
    const isMobile = width < BREAKPOINTS.md;
    const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg && isTouchDevice;
    const isDesktop = width >= BREAKPOINTS.lg && !isTouchDevice;

    // Determine orientation
    const orientation: 'portrait' | 'landscape' = height > width ? 'portrait' : 'landscape';

    setMobileState({
      isMobile,
      isTablet,
      isDesktop,
      isTouchDevice,
      orientation,
      screenSize,
      viewportHeight: height,
      viewportWidth: width,
    });
  }, []);

  // Set up event listeners
  useEffect(() => {
    updateMobileState();

    const handleResize = () => updateMobileState();
    const handleOrientationChange = () => {
      // Delay to allow for orientation change to complete
      setTimeout(updateMobileState, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateMobileState]);

  // Haptic feedback function
  const enableHapticFeedback = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Check if vibration API is available
    if ('vibrate' in navigator) {
      // Light haptic feedback (50ms)
      navigator.vibrate(50);
    }
  }, []);

  // Viewport optimization
  const optimizeForViewport = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Set viewport meta tag for mobile optimization
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }

    // Optimize viewport settings based on device
    if (mobileState.isMobile) {
      viewportMeta.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover'
      );
    } else {
      viewportMeta.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0'
      );
    }

    // Add CSS custom properties for viewport dimensions
    document.documentElement.style.setProperty('--vh', `${mobileState.viewportHeight * 0.01}px`);
    document.documentElement.style.setProperty('--vw', `${mobileState.viewportWidth * 0.01}px`);
  }, [mobileState]);

  // Screen orientation lock (experimental API)
  const lockOrientation = useCallback(async (orientation: 'portrait' | 'landscape') => {
    if (typeof window === 'undefined') return;

    try {
      if ('screen' in window && 'orientation' in window.screen && 'lock' in window.screen.orientation) {
        await (window.screen.orientation as any).lock(orientation);
      }
    } catch (error) {
      console.warn('Orientation lock not supported or failed:', error);
    }
  }, []);

  const unlockOrientation = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      if ('screen' in window && 'orientation' in window.screen && 'unlock' in window.screen.orientation) {
        (window.screen.orientation as any).unlock();
      }
    } catch (error) {
      console.warn('Orientation unlock not supported or failed:', error);
    }
  }, []);

  // Get recommended touch target size based on device
  const getTouchTargetSize = useCallback(() => {
    // WCAG recommends minimum 44px touch targets
    if (mobileState.isMobile) return 44;
    if (mobileState.isTablet) return 40;
    return 32; // Desktop can be smaller
  }, [mobileState.isMobile, mobileState.isTablet]);

  // Apply viewport optimization when state changes
  useEffect(() => {
    optimizeForViewport();
  }, [optimizeForViewport]);

  return {
    // State
    ...mobileState,
    
    // Actions
    enableHapticFeedback,
    optimizeForViewport,
    lockOrientation,
    unlockOrientation,
    
    // Utilities
    getTouchTargetSize,
    isLandscape: mobileState.orientation === 'landscape',
    isPortrait: mobileState.orientation === 'portrait',
    canVibrate: typeof navigator !== 'undefined' && 'vibrate' in navigator,
  };
}

// Hook for touch gesture handling
export function useTouchGestures(elementRef: React.RefObject<HTMLElement>) {
  const [touchState, setTouchState] = useState({
    isPressed: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    setTouchState({
      isPressed: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
    });
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchState.isPressed) return;
    
    const touch = e.touches[0];
    setTouchState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
    }));
  }, [touchState.isPressed]);

  const handleTouchEnd = useCallback(() => {
    setTouchState(prev => ({
      ...prev,
      isPressed: false,
    }));
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const deltaX = touchState.currentX - touchState.startX;
  const deltaY = touchState.currentY - touchState.startY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  return {
    touchState,
    deltaX,
    deltaY,
    distance,
    isSwipeLeft: deltaX < -50 && Math.abs(deltaY) < 100,
    isSwipeRight: deltaX > 50 && Math.abs(deltaY) < 100,
    isSwipeUp: deltaY < -50 && Math.abs(deltaX) < 100,
    isSwipeDown: deltaY > 50 && Math.abs(deltaX) < 100,
  };
}

// Hook for safe area handling (iOS notch, etc.)
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--sat') || '0', 10),
        right: parseInt(computedStyle.getPropertyValue('--sar') || '0', 10),
        bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0', 10),
        left: parseInt(computedStyle.getPropertyValue('--sal') || '0', 10),
      });
    };

    // Set CSS custom properties for safe area
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --sat: env(safe-area-inset-top);
        --sar: env(safe-area-inset-right);
        --sab: env(safe-area-inset-bottom);
        --sal: env(safe-area-inset-left);
      }
    `;
    document.head.appendChild(style);

    updateSafeArea();

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return safeArea;
}
