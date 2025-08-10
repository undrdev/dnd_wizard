import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import { useAppStore } from '@/stores/useAppStore';
import { NPCMarkers } from './NPCMarkers';
import { QuestMarkers } from './QuestMarkers';
import { LocationMarkers } from './LocationMarkers';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Next.js
import L from 'leaflet';
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
  const mapRef = useRef<L.Map | null>(null);

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
    <div className={`relative ${className}`}>
      <MapContainer
        center={mapState.center}
        zoom={mapState.zoom}
        className="h-full w-full"
        maxBounds={worldBounds}
        maxBoundsViscosity={1.0}
        minZoom={1}
        maxZoom={18}
        ref={mapRef}
      >
        {/* Base tile layer - using OpenStreetMap for now */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.7}
        />

        {/* Map controller for state sync */}
        <MapController />

        {/* Location markers */}
        <LocationMarkers />

        {/* NPC markers */}
        <NPCMarkers />

        {/* Quest markers */}
        <QuestMarkers />
      </MapContainer>

      {/* Map controls overlay */}
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        <MapControls />
      </div>

      {/* Map legend */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <MapLegend />
      </div>
    </div>
  );
}

// Map controls component
function MapControls() {
  const { mapState, setMapState } = useAppStore();

  const resetView = () => {
    setMapState({
      center: [0, 0],
      zoom: 2,
      selectedNpc: undefined,
      selectedQuest: undefined,
      selectedLocation: undefined,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-2 space-y-2">
      <button
        onClick={resetView}
        className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        title="Reset map view"
      >
        🏠 Reset View
      </button>
      
      <div className="text-xs text-gray-500 text-center">
        Zoom: {mapState.zoom}
      </div>
    </div>
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
