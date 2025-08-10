import React, { useState, useRef, useEffect } from 'react';
import { 
  MagnifyingGlassMinusIcon, 
  MagnifyingGlassPlusIcon,
  MapIcon,
  Cog6ToothIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from '@heroicons/react/24/outline';
import { useMobile, useTouchGestures } from '@/hooks/useMobile';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useMap } from '@/hooks/useMap';

interface MobileMapControlsProps {
  className?: string;
}

export function MobileMapControls({ className = '' }: MobileMapControlsProps) {
  const { isMobile, isTablet, enableHapticFeedback, getTouchTargetSize } = useMobile();
  const { announceToScreenReader } = useAccessibility();
  const { mapRef, toggleLayer, layers, currentTheme } = useMap();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const controlsRef = useRef<HTMLDivElement>(null);
  const touchGestures = useTouchGestures(controlsRef);

  const touchTargetSize = getTouchTargetSize();

  // Handle zoom in
  const handleZoomIn = () => {
    if (mapRef) {
      mapRef.zoomIn();
      announceToScreenReader('Map zoomed in', 'polite');
      enableHapticFeedback();
    }
  };

  // Handle zoom out
  const handleZoomOut = () => {
    if (mapRef) {
      mapRef.zoomOut();
      announceToScreenReader('Map zoomed out', 'polite');
      enableHapticFeedback();
    }
  };

  // Handle layer toggle
  const handleLayerToggle = (layerId: string) => {
    toggleLayer(layerId);
    const layer = layers.find(l => l.id === layerId);
    const isVisible = layer?.visible;
    announceToScreenReader(
      `${layer?.name} layer ${isVisible ? 'hidden' : 'shown'}`, 
      'polite'
    );
    enableHapticFeedback();
  };

  // Handle fullscreen toggle
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      announceToScreenReader('Entered fullscreen mode', 'polite');
    } else {
      document.exitFullscreen?.();
      announceToScreenReader('Exited fullscreen mode', 'polite');
    }
    enableHapticFeedback();
  };

  // Close panels when touching outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (controlsRef.current && !controlsRef.current.contains(event.target as Node)) {
        setShowLayerPanel(false);
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Don't render on desktop
  if (!isMobile && !isTablet) {
    return null;
  }

  const buttonBaseClasses = `
    inline-flex items-center justify-center rounded-lg bg-white shadow-lg border border-gray-200 
    text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
  `;

  const buttonSizeClasses = `w-[${touchTargetSize}px] h-[${touchTargetSize}px]`;

  return (
    <div 
      ref={controlsRef}
      className={`fixed bottom-4 right-4 z-[1000] ${className}`}
      role="toolbar"
      aria-label="Map controls"
    >
      {/* Layer Panel */}
      {showLayerPanel && (
        <div className="absolute bottom-16 right-0 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 mb-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Map Layers</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {layers.map(layer => (
              <label 
                key={layer.id}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                style={{ minHeight: `${touchTargetSize}px` }}
              >
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={() => handleLayerToggle(layer.id)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  aria-label={`Toggle ${layer.name} layer`}
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    {layer.name}
                  </span>
                </div>
                {layer.visible ? (
                  <EyeIcon className="w-4 h-4 text-primary-600" aria-hidden="true" />
                ) : (
                  <EyeSlashIcon className="w-4 h-4 text-gray-400" aria-hidden="true" />
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 flex flex-col space-y-2 mb-2">
          {/* Zoom Controls */}
          <div className="flex flex-col space-y-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1">
            <button
              onClick={handleZoomIn}
              className={`${buttonBaseClasses} ${buttonSizeClasses}`}
              aria-label="Zoom in"
              type="button"
            >
              <MagnifyingGlassPlusIcon className="w-5 h-5" aria-hidden="true" />
            </button>
            
            <button
              onClick={handleZoomOut}
              className={`${buttonBaseClasses} ${buttonSizeClasses}`}
              aria-label="Zoom out"
              type="button"
            >
              <MagnifyingGlassMinusIcon className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Layer Toggle */}
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className={`${buttonBaseClasses} ${buttonSizeClasses} ${
              showLayerPanel ? 'bg-primary-50 text-primary-700' : ''
            }`}
            aria-label="Toggle layer panel"
            aria-expanded={showLayerPanel}
            type="button"
          >
            <MapIcon className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleFullscreen}
            className={`${buttonBaseClasses} ${buttonSizeClasses}`}
            aria-label="Toggle fullscreen"
            type="button"
          >
            {document.fullscreenElement ? (
              <ArrowsPointingInIcon className="w-5 h-5" aria-hidden="true" />
            ) : (
              <ArrowsPointingOutIcon className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      )}

      {/* Main Toggle Button */}
      <button
        onClick={() => {
          setIsExpanded(!isExpanded);
          setShowLayerPanel(false);
          enableHapticFeedback();
        }}
        className={`${buttonBaseClasses} ${buttonSizeClasses} ${
          isExpanded ? 'bg-primary-50 text-primary-700' : ''
        }`}
        aria-label={isExpanded ? 'Collapse map controls' : 'Expand map controls'}
        aria-expanded={isExpanded}
        type="button"
      >
        <Cog6ToothIcon 
          className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
          aria-hidden="true" 
        />
      </button>
    </div>
  );
}

// Touch-optimized map interaction component
export function TouchMapInteractions() {
  const { isMobile, enableHapticFeedback } = useMobile();
  const { announceToScreenReader } = useAccessibility();
  const { mapRef } = useMap();
  const [lastTap, setLastTap] = useState(0);
  const [tapCount, setTapCount] = useState(0);

  // Handle double tap to zoom
  const handleMapTouch = (event: React.TouchEvent) => {
    if (!isMobile || !mapRef) return;

    const now = Date.now();
    const timeDiff = now - lastTap;

    if (timeDiff < 300 && timeDiff > 0) {
      // Double tap detected
      setTapCount(prev => prev + 1);
      
      if (tapCount === 0) {
        // First double tap - zoom in
        const touch = event.touches[0] || event.changedTouches[0];
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        mapRef.zoomIn();
        announceToScreenReader('Double tap zoom in', 'polite');
        enableHapticFeedback();
      }
    } else {
      setTapCount(0);
    }

    setLastTap(now);
  };

  // Handle long press for context menu
  const handleLongPress = (event: React.TouchEvent) => {
    if (!isMobile) return;

    enableHapticFeedback();
    announceToScreenReader('Long press detected', 'polite');
    
    // Prevent default context menu
    event.preventDefault();
  };

  if (!isMobile) return null;

  return (
    <div
      className="absolute inset-0 z-10 pointer-events-none"
      onTouchStart={handleMapTouch}
      onTouchEnd={handleLongPress}
      style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
    />
  );
}

// Gesture instructions for new users
export function MapGestureInstructions() {
  const { isMobile } = useMobile();
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (isMobile) {
      const hasSeenInstructions = localStorage.getItem('map-gesture-instructions-seen');
      if (!hasSeenInstructions) {
        setShowInstructions(true);
      }
    }
  }, [isMobile]);

  const handleDismiss = () => {
    setShowInstructions(false);
    localStorage.setItem('map-gesture-instructions-seen', 'true');
  };

  if (!isMobile || !showInstructions) return null;

  return (
    <div className="absolute top-4 left-4 right-4 z-[1001] bg-white rounded-lg shadow-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        Map Navigation
      </h3>
      <ul className="text-xs text-gray-600 space-y-1 mb-3">
        <li>• Drag to pan around the map</li>
        <li>• Pinch to zoom in and out</li>
        <li>• Double tap to zoom in</li>
        <li>• Tap markers to view details</li>
      </ul>
      <button
        onClick={handleDismiss}
        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
      >
        Got it!
      </button>
    </div>
  );
}
