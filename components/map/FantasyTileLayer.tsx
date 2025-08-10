import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { generateFantasyTileUrl } from '@/lib/fantasyMapGenerator';

interface FantasyTileLayerProps {
  mapSeed: string;
  opacity?: number;
  attribution?: string;
}

/**
 * Custom Leaflet tile layer for fantasy maps
 */
class FantasyTileLayer extends L.TileLayer {
  private mapSeed: string;

  constructor(mapSeed: string, options?: L.TileLayerOptions) {
    // Use a placeholder URL template - we'll override getTileUrl
    super('', options);
    this.mapSeed = mapSeed;
  }

  getTileUrl(coords: L.Coords): string {
    // Generate fantasy tile based on coordinates and map seed
    return generateFantasyTileUrl(coords.x, coords.y, coords.z, this.mapSeed);
  }

  // Override createTile to handle data URLs properly
  createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const tile = document.createElement('img');
    
    L.DomEvent.on(tile, 'load', () => {
      done(undefined, tile);
    });

    L.DomEvent.on(tile, 'error', () => {
      done(new Error('Tile failed to load'), tile);
    });

    // Set crossOrigin to handle data URLs
    tile.crossOrigin = '';
    tile.alt = '';
    tile.setAttribute('role', 'presentation');
    
    // Generate the fantasy tile
    tile.src = this.getTileUrl(coords);
    
    return tile;
  }
}

/**
 * React component wrapper for FantasyTileLayer
 */
export function FantasyTileLayerComponent({ 
  mapSeed, 
  opacity = 1, 
  attribution = 'Procedurally Generated Fantasy World' 
}: FantasyTileLayerProps) {
  const map = useMap();
  const layerRef = useRef<FantasyTileLayer | null>(null);

  useEffect(() => {
    if (!map || !mapSeed) return;

    // Create fantasy tile layer
    const fantasyLayer = new FantasyTileLayer(mapSeed, {
      opacity,
      attribution,
      maxZoom: 18,
      minZoom: 1,
      tileSize: 256,
      zoomOffset: 0,
      updateWhenIdle: false,
      updateWhenZooming: true,
      keepBuffer: 2
    });

    // Add to map
    fantasyLayer.addTo(map);
    layerRef.current = fantasyLayer;

    // Cleanup function
    return () => {
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, mapSeed, opacity, attribution]);

  // Update opacity when it changes
  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setOpacity(opacity);
    }
  }, [opacity]);

  return null; // This component doesn't render anything directly
}
