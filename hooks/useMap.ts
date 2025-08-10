import { useCallback, useRef, useState } from 'react';
import L from 'leaflet';
import { useAppStore } from '@/stores/useAppStore';
import {
  calculateDistance,
  calculateArea,
  createAnnotationFromLeafletLayer,
  exportMapAsImage
} from '@/lib/mapUtils';
import { DEFAULT_MAP_THEMES, DEFAULT_TERRAIN_LAYERS } from '@/lib/mapThemes';
import type { 
  MapAnnotation, 
  LatLng, 
  DrawingMode, 
  MapExportOptions,
  MeasurementResult,
  MapLayer
} from '@/types';

export function useMap() {
  const { mapState, setMapState, currentCampaign } = useAppStore();
  const mapRef = useRef<L.Map | null>(null);
  const drawingLayerRef = useRef<L.FeatureGroup | null>(null);
  const [measurementPoints, setMeasurementPoints] = useState<LatLng[]>([]);
  const [currentMeasurement, setCurrentMeasurement] = useState<MeasurementResult | null>(null);

  // Initialize map reference
  const setMapRef = useCallback((map: L.Map | null) => {
    mapRef.current = map;
    
    if (map && !drawingLayerRef.current) {
      // Create drawing layer
      drawingLayerRef.current = new L.FeatureGroup();
      map.addLayer(drawingLayerRef.current);
    }
  }, []);

  // Layer management
  const toggleLayer = useCallback((layerId: string) => {
    const updatedLayers = mapState.layers.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    );
    setMapState({ layers: updatedLayers });
  }, [mapState.layers, setMapState]);

  const setLayerOpacity = useCallback((layerId: string, opacity: number) => {
    const updatedLayers = mapState.layers.map(layer =>
      layer.id === layerId ? { ...layer, opacity } : layer
    );
    setMapState({ layers: updatedLayers });
  }, [mapState.layers, setMapState]);

  const addLayer = useCallback((layer: MapLayer) => {
    setMapState({ layers: [...mapState.layers, layer] });
  }, [mapState.layers, setMapState]);

  const removeLayer = useCallback((layerId: string) => {
    const updatedLayers = mapState.layers.filter(layer => layer.id !== layerId);
    setMapState({ layers: updatedLayers });
  }, [mapState.layers, setMapState]);

  // Drawing tools
  const setDrawingMode = useCallback((mode: DrawingMode) => {
    setMapState({ drawingMode: mode });
    
    if (mode === 'none') {
      // Clear any active drawing
      setMeasurementPoints([]);
      setCurrentMeasurement(null);
    }
  }, [setMapState]);

  const addAnnotation = useCallback((annotation: Omit<MapAnnotation, 'id' | 'campaignId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentCampaign) return;

    const newAnnotation: MapAnnotation = {
      ...annotation,
      id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      campaignId: currentCampaign.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setMapState({ 
      annotations: [...mapState.annotations, newAnnotation] 
    });

    return newAnnotation;
  }, [currentCampaign, mapState.annotations, setMapState]);

  const updateAnnotation = useCallback((annotationId: string, updates: Partial<MapAnnotation>) => {
    const updatedAnnotations = mapState.annotations.map(annotation =>
      annotation.id === annotationId 
        ? { ...annotation, ...updates, updatedAt: new Date() }
        : annotation
    );
    setMapState({ annotations: updatedAnnotations });
  }, [mapState.annotations, setMapState]);

  const deleteAnnotation = useCallback((annotationId: string) => {
    const updatedAnnotations = mapState.annotations.filter(
      annotation => annotation.id !== annotationId
    );
    setMapState({ annotations: updatedAnnotations });
  }, [mapState.annotations, setMapState]);

  // Measurement tools
  const startMeasurement = useCallback(() => {
    setMapState({ measurementMode: true });
    setMeasurementPoints([]);
    setCurrentMeasurement(null);
  }, [setMapState]);

  const addMeasurementPoint = useCallback((point: LatLng) => {
    const newPoints = [...measurementPoints, point];
    setMeasurementPoints(newPoints);

    if (newPoints.length >= 2) {
      if (mapState.drawingMode === 'line') {
        // Calculate distance
        const distance = newPoints.reduce((total, point, index) => {
          if (index === 0) return 0;
          return total + calculateDistance(newPoints[index - 1], point);
        }, 0);

        setCurrentMeasurement({
          type: 'distance',
          value: distance,
          unit: 'km',
          coordinates: newPoints
        });
      } else if (mapState.drawingMode === 'polygon' && newPoints.length >= 3) {
        // Calculate area
        const area = calculateArea(newPoints);
        setCurrentMeasurement({
          type: 'area',
          value: area,
          unit: 'km²',
          coordinates: newPoints
        });
      }
    }
  }, [measurementPoints, mapState.drawingMode]);

  const finishMeasurement = useCallback(() => {
    setMapState({ measurementMode: false });
    setMeasurementPoints([]);
    
    // Optionally save measurement as annotation
    if (currentMeasurement) {
      addAnnotation({
        type: currentMeasurement.type === 'distance' ? 'line' : 'polygon',
        coordinates: currentMeasurement.coordinates,
        style: {
          color: '#ef4444',
          weight: 3,
          opacity: 0.8,
          fillOpacity: 0.2
        },
        label: `${currentMeasurement.type === 'distance' ? 'Distance' : 'Area'}: ${currentMeasurement.value.toFixed(2)} ${currentMeasurement.unit}`
      });
    }
    
    setCurrentMeasurement(null);
  }, [setMapState, currentMeasurement, addAnnotation]);

  // Map export
  const exportMap = useCallback(async (options: MapExportOptions): Promise<string> => {
    if (!mapRef.current) {
      throw new Error('Map not initialized');
    }

    return exportMapAsImage(mapRef.current, options);
  }, []);

  // Theme management
  const setMapTheme = useCallback((themeId: string) => {
    const theme = DEFAULT_MAP_THEMES.find(t => t.id === themeId);
    if (theme) {
      setMapState({ currentTheme: theme });
    }
  }, [setMapState]);

  // Clustering
  const toggleClustering = useCallback(() => {
    setMapState({ clusteringEnabled: !mapState.clusteringEnabled });
  }, [mapState.clusteringEnabled, setMapState]);

  // Initialize default layers if empty
  const initializeDefaultLayers = useCallback(() => {
    if (mapState.layers.length === 0) {
      // Set fantasy theme for campaigns with mapSeed, otherwise use standard theme
      const defaultTheme = currentCampaign?.mapSeed
        ? DEFAULT_MAP_THEMES.find(theme => theme.id === 'fantasy') || DEFAULT_MAP_THEMES[0]
        : DEFAULT_MAP_THEMES[0];

      setMapState({
        layers: [...DEFAULT_TERRAIN_LAYERS],
        currentTheme: defaultTheme
      });
    }
  }, [mapState.layers.length, setMapState, currentCampaign]);

  // Utility functions
  const fitBoundsToAnnotations = useCallback(() => {
    if (!mapRef.current || mapState.annotations.length === 0) return;

    const bounds = L.latLngBounds([]);
    mapState.annotations.forEach(annotation => {
      annotation.coordinates.forEach(coord => {
        bounds.extend([coord.lat, coord.lng]);
      });
    });

    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [mapState.annotations]);

  const clearAllAnnotations = useCallback(() => {
    setMapState({ annotations: [] });
  }, [setMapState]);

  const getVisibleLayers = useCallback(() => {
    return mapState.layers.filter(layer => layer.visible);
  }, [mapState.layers]);

  return {
    // Map reference
    mapRef: mapRef.current,
    setMapRef,
    
    // Layer management
    toggleLayer,
    setLayerOpacity,
    addLayer,
    removeLayer,
    getVisibleLayers,
    initializeDefaultLayers,
    
    // Drawing tools
    setDrawingMode,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    
    // Measurement tools
    startMeasurement,
    addMeasurementPoint,
    finishMeasurement,
    currentMeasurement,
    measurementPoints,
    
    // Export
    exportMap,
    
    // Theme management
    setMapTheme,
    
    // Clustering
    toggleClustering,
    
    // Utilities
    fitBoundsToAnnotations,
    clearAllAnnotations,
    
    // State
    drawingMode: mapState.drawingMode,
    measurementMode: mapState.measurementMode,
    clusteringEnabled: mapState.clusteringEnabled,
    currentTheme: mapState.currentTheme,
    layers: mapState.layers,
    annotations: mapState.annotations
  };
}
