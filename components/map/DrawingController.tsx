import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from '@/stores/useAppStore';
import { useMap as useMapHook } from '@/hooks/useMap';

/**
 * DrawingController - Handles drawing interactions inside MapContainer
 * This component must be inside MapContainer to access the Leaflet map instance
 */
export function DrawingController() {
  const map = useMap();
  const { mapState } = useAppStore();
  const {
    drawingMode,
    addAnnotation
  } = useMapHook();

  // Default drawing settings - these could be made configurable later
  const currentColor = '#3b82f6';
  const strokeWidth = 3;
  const fillOpacity = 0.3;

  useEffect(() => {
    if (!map) return;

    let isDrawing = false;
    let currentPath: L.LatLng[] = [];

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (drawingMode === 'none') return;

      const point = e.latlng;

      if (drawingMode === 'line' || drawingMode === 'polygon') {
        if (!isDrawing) {
          // Start drawing
          isDrawing = true;
          currentPath = [point];
        } else {
          // Continue drawing
          currentPath = [...currentPath, point];
        }
      } else if (drawingMode === 'circle') {
        // Create circle at click point
        const annotation = {
          id: `circle_${Date.now()}`,
          campaignId: mapState.selectedLocation || 'default',
          type: 'circle' as const,
          coordinates: [point],
          style: {
            color: currentColor,
            fillColor: currentColor,
            weight: strokeWidth,
            opacity: 1,
            fillOpacity: fillOpacity,
          },
          label: 'Circle',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        addAnnotation(annotation);
      } else if (drawingMode === 'text') {
        // Add text annotation
        const text = prompt('Enter text:');
        if (text) {
          const annotation = {
            id: `text_${Date.now()}`,
            campaignId: mapState.selectedLocation || 'default',
            type: 'text' as const,
            coordinates: [point],
            style: {
              color: currentColor,
              weight: strokeWidth,
              opacity: 1,
              fontSize: 14,
              fontFamily: 'Arial',
            },
            label: text,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          addAnnotation(annotation);
        }
      }
    };

    const handleMapDoubleClick = () => {
      if (isDrawing && currentPath.length > 1) {
        // Finish drawing
        const annotation = {
          id: `${drawingMode}_${Date.now()}`,
          campaignId: mapState.selectedLocation || 'default',
          type: drawingMode as 'line' | 'polygon',
          coordinates: currentPath,
          style: {
            color: currentColor,
            fillColor: currentColor,
            weight: strokeWidth,
            opacity: 1,
            fillOpacity: drawingMode === 'polygon' ? fillOpacity : 0,
          },
          label: `${drawingMode.charAt(0).toUpperCase() + drawingMode.slice(1)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        addAnnotation(annotation);
        isDrawing = false;
        currentPath = [];
      }
    };

    map.on('click', handleMapClick);
    map.on('dblclick', handleMapDoubleClick);

    return () => {
      map.off('click', handleMapClick);
      map.off('dblclick', handleMapDoubleClick);
    };
  }, [map, drawingMode, currentColor, strokeWidth, fillOpacity, addAnnotation, mapState.selectedLocation]);

  // This component doesn't render anything visible
  return null;
}
