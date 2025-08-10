import React, { useEffect } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from '@/stores/useAppStore';
import { useMap as useMapHook } from '@/hooks/useMap';
import type { TerrainLayer, BiomeLayer } from '@/types';

export function TerrainLayers() {
  const { mapState } = useAppStore();
  const { getVisibleLayers } = useMapHook();
  const map = useMap();

  const visibleLayers = getVisibleLayers();
  const terrainLayers = visibleLayers.filter(layer => 
    layer.type === 'terrain'
  ) as TerrainLayer[];

  return (
    <>
      {terrainLayers.map((layer) => (
        <TileLayer
          key={layer.id}
          url={layer.url || ''}
          opacity={layer.opacity}
          minZoom={layer.minZoom}
          maxZoom={layer.maxZoom}
          attribution={getTerrainAttribution(layer.terrainType)}
        />
      ))}
      <BiomeLayers />
    </>
  );
}

function BiomeLayers() {
  const { mapState } = useAppStore();
  const { getVisibleLayers } = useMapHook();

  const visibleLayers = getVisibleLayers();
  const biomeLayers = visibleLayers.filter(layer => 
    layer.type === 'custom' && 'biomeType' in layer
  ) as BiomeLayer[];

  return (
    <>
      {biomeLayers.map((layer) => (
        <BiomeOverlay key={layer.id} layer={layer} />
      ))}
    </>
  );
}

interface BiomeOverlayProps {
  layer: BiomeLayer;
}

function BiomeOverlay({ layer }: BiomeOverlayProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !layer.visible) return;

    // Create biome overlay based on type
    const biomeStyle = getBiomeStyle(layer.biomeType);
    
    // For now, create a simple colored overlay
    // In a real implementation, you'd use GeoJSON data
    const biomeOverlay = L.rectangle(
      map.getBounds(),
      {
        color: biomeStyle.color,
        fillColor: biomeStyle.fillColor,
        fillOpacity: layer.opacity * 0.3,
        weight: 0,
        interactive: false
      }
    );

    map.addLayer(biomeOverlay);

    return () => {
      map.removeLayer(biomeOverlay);
    };
  }, [map, layer]);

  return null;
}

function getTerrainAttribution(terrainType: TerrainLayer['terrainType']): string {
  switch (terrainType) {
    case 'topographic':
      return '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors';
    case 'satellite':
      return '&copy; <a href="https://www.esri.com/">Esri</a>';
    case 'hybrid':
      return '&copy; <a href="https://www.esri.com/">Esri</a>';
    case 'physical':
      return '&copy; <a href="https://www.naturalearthdata.com/">Natural Earth</a>';
    default:
      return '';
  }
}

function getBiomeStyle(biomeType: BiomeLayer['biomeType']) {
  const styles = {
    forest: { color: '#22c55e', fillColor: '#16a34a' },
    desert: { color: '#f59e0b', fillColor: '#d97706' },
    mountain: { color: '#6b7280', fillColor: '#4b5563' },
    ocean: { color: '#3b82f6', fillColor: '#2563eb' },
    grassland: { color: '#84cc16', fillColor: '#65a30d' },
    tundra: { color: '#e5e7eb', fillColor: '#d1d5db' }
  };

  return styles[biomeType] || styles.grassland;
}

// Predefined biome layers that can be added
export const PREDEFINED_BIOME_LAYERS: BiomeLayer[] = [
  {
    id: 'forest-biome',
    name: 'Forest Regions',
    type: 'custom',
    biomeType: 'forest',
    visible: false,
    opacity: 0.4
  },
  {
    id: 'desert-biome',
    name: 'Desert Regions',
    type: 'custom',
    biomeType: 'desert',
    visible: false,
    opacity: 0.4
  },
  {
    id: 'mountain-biome',
    name: 'Mountain Ranges',
    type: 'custom',
    biomeType: 'mountain',
    visible: false,
    opacity: 0.4
  },
  {
    id: 'ocean-biome',
    name: 'Ocean Areas',
    type: 'custom',
    biomeType: 'ocean',
    visible: false,
    opacity: 0.3
  },
  {
    id: 'grassland-biome',
    name: 'Grasslands',
    type: 'custom',
    biomeType: 'grassland',
    visible: false,
    opacity: 0.3
  },
  {
    id: 'tundra-biome',
    name: 'Tundra',
    type: 'custom',
    biomeType: 'tundra',
    visible: false,
    opacity: 0.4
  }
];

// Component to add predefined biome layers
export function BiomeLayerControls() {
  const { addLayer } = useMapHook();

  const addBiomeLayer = (biomeLayer: BiomeLayer) => {
    addLayer(biomeLayer);
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-900">Add Biome Layers</h4>
      <div className="grid grid-cols-2 gap-2">
        {PREDEFINED_BIOME_LAYERS.map((layer) => (
          <button
            key={layer.id}
            onClick={() => addBiomeLayer(layer)}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border text-gray-700"
            title={`Add ${layer.name}`}
          >
            {layer.name}
          </button>
        ))}
      </div>
    </div>
  );
}
