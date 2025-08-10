import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import L from 'leaflet';
import { useAppStore } from '@/stores/useAppStore';
import { useMap as useMapHook } from '@/hooks/useMap';
import { useMobile } from '@/hooks/useMobile';
import { useAccessibility } from '@/hooks/useAccessibility';
import { NPCMarkers } from './NPCMarkers';
import { QuestMarkers } from './QuestMarkers';
import { LocationMarkers } from './LocationMarkers';
import { CustomMarkers } from './CustomMarkers';
import { TerrainLayers } from './TerrainLayers';
import { LayerManager } from './LayerManager';
import { DrawingTools } from './DrawingTools';
import { MobileMapControls, TouchMapInteractions, MapGestureInstructions } from './MobileMapControls';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

interface CampaignMapProps {
  className?: string;
}

// Component to handle map state synchronization
function MapController() {
  const map = useMap();
  const { mapState, setMapState } = useAppStore();

  useEffect(() => {
    if (map) {
      // Set initial view
      map.setView(mapState.center, mapState.zoom);

      // Listen for map events
      const handleMoveEnd = () => {
        const center = map.getCenter();
        setMapState({
          center: [center.lat, center.lng],
          zoom: map.getZoom(),
        });
      };

      const handleZoomEnd = () => {
        setMapState({
          zoom: map.getZoom(),
        });
      };

      map.on('moveend', handleMoveEnd);
      map.on('zoomend', handleZoomEnd);

      return () => {
        map.off('moveend', handleMoveEnd);
        map.off('zoomend', handleZoomEnd);
      };
    }
  }, [map, setMapState]);

  return null;
}

export function CampaignMap({ className = '' }: CampaignMapProps) {
  const { mapState, currentCampaign } = useAppStore();
  const { setMapRef, initializeDefaultLayers, currentTheme } = useMapHook();
  const { isMobile, isTablet } = useMobile();
  const { announceToScreenReader } = useAccessibility();
  const mapRef = useRef<L.Map | null>(null);

  // Initialize default layers on mount
  useEffect(() => {
    initializeDefaultLayers();
  }, [initializeDefaultLayers]);

  // World bounds for fantasy map
  const worldBounds = new LatLngBounds(
    [-85, -180], // Southwest
    [85, 180]    // Northeast
  );

  if (!currentCampaign) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Campaign Selected
          </h3>
          <p className="text-gray-600">
            Create or select a campaign to view the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative ${className}`}
      role="application"
      aria-label="Interactive campaign map"
    >
      {/* Map gesture instructions for mobile users */}
      <MapGestureInstructions />

      <MapContainer
        center={mapState.center}
        zoom={mapState.zoom}
        className="h-full w-full"
        maxBounds={worldBounds}
        maxBoundsViscosity={1.0}
        minZoom={1}
        maxZoom={18}
        ref={(map) => {
          mapRef.current = map;
          setMapRef(map);
          if (map) {
            announceToScreenReader('Map loaded and ready for interaction', 'polite');
          }
        }}
      >
        {/* Base tile layer - using theme-based layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={currentTheme?.baseLayer || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
          opacity={0.7}
        />

        {/* Terrain and biome layers */}
        <TerrainLayers />

        {/* Map controller for state sync */}
        <MapController />

        {/* Enhanced custom markers with clustering */}
        <CustomMarkers />

        {/* Fallback to individual markers if needed */}
        <LocationMarkers />
        <NPCMarkers />
        <QuestMarkers />

        {/* Annotations layer */}
        <AnnotationsLayer />
      </MapContainer>

      {/* Touch interactions for mobile */}
      <TouchMapInteractions />

      {/* Desktop map controls - hidden on mobile */}
      {!isMobile && !isTablet && (
        <div className="absolute top-4 right-4 z-[1000] space-y-2">
          <MapControls />
        </div>
      )}

      {/* Mobile map controls */}
      <MobileMapControls />

      {/* Map legend - responsive positioning */}
      <div className={`absolute z-[1000] ${
        isMobile ? 'bottom-20 left-4' : 'bottom-4 left-4'
      }`}>
        <MapLegend />
      </div>
    </div>
  );
}

// Annotations layer component
function AnnotationsLayer() {
  const { annotations } = useMapHook();
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const annotationLayers: L.Layer[] = [];

    annotations.forEach(annotation => {
      let layer: L.Layer | null = null;

      switch (annotation.type) {
        case 'line':
          if (annotation.coordinates.length >= 2) {
            layer = L.polyline(
              annotation.coordinates.map(coord => [coord.lat, coord.lng]),
              annotation.style
            );
          }
          break;

        case 'polygon':
          if (annotation.coordinates.length >= 3) {
            layer = L.polygon(
              annotation.coordinates.map(coord => [coord.lat, coord.lng]),
              annotation.style
            );
          }
          break;

        case 'circle':
          if (annotation.coordinates.length >= 1) {
            const center = annotation.coordinates[0];
            const radius = annotation.coordinates.length > 1
              ? L.latLng(center.lat, center.lng).distanceTo(L.latLng(annotation.coordinates[1].lat, annotation.coordinates[1].lng))
              : 1000;

            layer = L.circle([center.lat, center.lng], {
              radius,
              ...annotation.style
            });
          }
          break;

        case 'rectangle':
          if (annotation.coordinates.length >= 2) {
            const bounds = L.latLngBounds(
              [annotation.coordinates[0].lat, annotation.coordinates[0].lng],
              [annotation.coordinates[1].lat, annotation.coordinates[1].lng]
            );
            layer = L.rectangle(bounds, annotation.style);
          }
          break;

        case 'text':
          if (annotation.coordinates.length >= 1 && annotation.label) {
            const coord = annotation.coordinates[0];
            layer = L.marker([coord.lat, coord.lng], {
              icon: L.divIcon({
                html: `<div style="
                  color: ${annotation.style.color};
                  font-size: ${annotation.style.fontSize || 14}px;
                  font-family: ${annotation.style.fontFamily || 'Arial'};
                  font-weight: bold;
                  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                  white-space: nowrap;
                ">${annotation.label}</div>`,
                className: 'text-annotation',
                iconSize: [0, 0],
                iconAnchor: [0, 0]
              })
            });
          }
          break;
      }

      if (layer) {
        if (annotation.label && annotation.type !== 'text') {
          layer.bindPopup(annotation.label);
        }
        map.addLayer(layer);
        annotationLayers.push(layer);
      }
    });

    return () => {
      annotationLayers.forEach(layer => {
        map.removeLayer(layer);
      });
    };
  }, [map, annotations]);

  return null;
}

// Enhanced Map controls component
function MapControls() {
  const { mapState, setMapState } = useAppStore();
  const {
    toggleClustering,
    clusteringEnabled,
    exportMap,
    fitBoundsToAnnotations,
    clearAllAnnotations
  } = useMapHook();

  const [showLayerManager, setShowLayerManager] = useState(false);
  const [showDrawingTools, setShowDrawingTools] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const resetView = () => {
    setMapState({
      center: [0, 0],
      zoom: 2,
      selectedNpc: undefined,
      selectedQuest: undefined,
      selectedLocation: undefined,
    });
  };

  const handleExportMap = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await exportMap({
        format: 'png',
        quality: 0.9,
        includeAnnotations: true,
        includeLayers: [],
        width: 1920,
        height: 1080
      });

      // Download the image
      const link = document.createElement('a');
      link.download = `campaign-map-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export map:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-2 space-y-2 min-w-[120px]">
        {/* Basic Controls */}
        <button
          onClick={resetView}
          className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="Reset map view"
        >
          🏠 Reset View
        </button>

        {/* Layer Manager Toggle */}
        <button
          onClick={() => setShowLayerManager(!showLayerManager)}
          className={`w-full px-3 py-2 text-sm font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            showLayerManager
              ? 'bg-blue-50 text-blue-700 border-blue-300'
              : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
          }`}
          title="Manage map layers"
        >
          🗂️ Layers
        </button>

        {/* Drawing Tools Toggle */}
        <button
          onClick={() => setShowDrawingTools(!showDrawingTools)}
          className={`w-full px-3 py-2 text-sm font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            showDrawingTools
              ? 'bg-green-50 text-green-700 border-green-300'
              : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
          }`}
          title="Drawing and annotation tools"
        >
          ✏️ Draw
        </button>

        {/* Clustering Toggle */}
        <button
          onClick={toggleClustering}
          className={`w-full px-3 py-2 text-sm font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            clusteringEnabled
              ? 'bg-purple-50 text-purple-700 border-purple-300'
              : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
          }`}
          title="Toggle marker clustering"
        >
          🔗 Cluster
        </button>

        {/* Fit to Annotations */}
        <button
          onClick={fitBoundsToAnnotations}
          className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="Fit map to show all annotations"
        >
          🎯 Fit All
        </button>

        {/* Export Map */}
        <button
          onClick={handleExportMap}
          disabled={isExporting}
          className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          title="Export map as image"
        >
          {isExporting ? '⏳' : '📸'} Export
        </button>

        {/* Clear Annotations */}
        <button
          onClick={clearAllAnnotations}
          className="w-full px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          title="Clear all annotations"
        >
          🗑️ Clear
        </button>

        {/* Map Info */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <div>Zoom: {mapState.zoom}</div>
          <div>Annotations: {mapState.annotations?.length || 0}</div>
          <div>Layers: {mapState.layers?.filter(l => l.visible).length || 0}</div>
        </div>
      </div>

      {/* Layer Manager Modal */}
      {showLayerManager && (
        <LayerManager
          isOpen={showLayerManager}
          onClose={() => setShowLayerManager(false)}
        />
      )}

      {/* Drawing Tools Modal */}
      {showDrawingTools && (
        <DrawingTools
          isOpen={showDrawingTools}
          onClose={() => setShowDrawingTools(false)}
        />
      )}
    </>
  );
}

// Map legend component
function MapLegend() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-3 max-w-xs">
      <h4 className="text-sm font-medium text-gray-900 mb-2">Legend</h4>
      <div className="space-y-1 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span>Locations</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span>NPCs</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
          <span>Active Quests</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span>High Priority</span>
        </div>
      </div>
    </div>
  );
}
