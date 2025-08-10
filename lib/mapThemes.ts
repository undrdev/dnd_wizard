import type { MapTheme, TerrainLayer } from '@/types';

// Default map themes (no Leaflet imports here)
export const DEFAULT_MAP_THEMES: MapTheme[] = [
  {
    id: 'standard',
    name: 'Standard',
    baseLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    markerStyle: {
      npc: { color: '#10b981', size: 25, icon: '👤' },
      quest: { color: '#f59e0b', size: 25, icon: '⚡' },
      location: { color: '#3b82f6', size: 30, icon: '📍' }
    }
  },
  {
    id: 'fantasy',
    name: 'Fantasy',
    baseLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    markerStyle: {
      npc: { color: '#8b5cf6', size: 25, icon: '🧙', clusterColor: '#7c3aed' },
      quest: { color: '#f59e0b', size: 25, icon: '⚔️', clusterColor: '#d97706' },
      location: { color: '#ef4444', size: 30, icon: '🏰', clusterColor: '#dc2626' }
    }
  },
  {
    id: 'dark',
    name: 'Dark',
    baseLayer: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    markerStyle: {
      npc: { color: '#06d6a0', size: 25, icon: '👤', clusterColor: '#059669' },
      quest: { color: '#ffd60a', size: 25, icon: '⚡', clusterColor: '#f59e0b' },
      location: { color: '#118ab2', size: 30, icon: '📍', clusterColor: '#0284c7' }
    }
  }
];

// Default terrain layers (no Leaflet imports here)
export const DEFAULT_TERRAIN_LAYERS: TerrainLayer[] = [
  {
    id: 'topographic',
    name: 'Topographic',
    type: 'terrain',
    terrainType: 'topographic',
    visible: false,
    opacity: 0.7,
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
  },
  {
    id: 'satellite',
    name: 'Satellite',
    type: 'terrain',
    terrainType: 'satellite',
    visible: false,
    opacity: 0.8,
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  }
];
