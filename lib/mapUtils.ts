import L from 'leaflet';
import type { 
  MapLayer, 
  MapAnnotation, 
  LatLng, 
  TerrainLayer, 
  BiomeLayer,
  MapExportOptions,
  MeasurementResult,
  MapTheme
} from '@/types';

// Map themes and terrain layers are now in @/lib/mapThemes to avoid SSR issues

// Distance calculation utilities
export function calculateDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateArea(coordinates: LatLng[]): number {
  if (coordinates.length < 3) return 0;
  
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i].lng * coordinates[j].lat;
    area -= coordinates[j].lng * coordinates[i].lat;
  }
  
  area = Math.abs(area) / 2;
  
  // Convert to square kilometers (approximate)
  const earthRadius = 6371;
  return area * Math.pow(earthRadius * Math.PI / 180, 2);
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Annotation utilities
export function createAnnotationFromLeafletLayer(layer: L.Layer, type: MapAnnotation['type']): Partial<MapAnnotation> {
  const coordinates: LatLng[] = [];
  
  if (layer instanceof L.Polyline) {
    const latLngs = layer.getLatLngs() as L.LatLng[];
    coordinates.push(...latLngs.map(ll => ({ lat: ll.lat, lng: ll.lng })));
  } else if (layer instanceof L.Circle) {
    const center = layer.getLatLng();
    const radius = layer.getRadius();
    // Create circle approximation with points
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * 2 * Math.PI;
      const lat = center.lat + (radius / 111320) * Math.cos(angle);
      const lng = center.lng + (radius / (111320 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(angle);
      coordinates.push({ lat, lng });
    }
  }
  
  return {
    type,
    coordinates,
    style: {
      color: '#3b82f6',
      weight: 3,
      opacity: 0.8,
      fillOpacity: 0.2
    }
  };
}

// Layer management utilities
export function createLeafletLayer(layer: MapLayer): L.TileLayer | null {
  if (layer.type === 'terrain' && layer.url) {
    return L.tileLayer(layer.url, {
      opacity: layer.opacity,
      minZoom: layer.minZoom,
      maxZoom: layer.maxZoom
    });
  }
  return null;
}

// Export utilities
export function exportMapAsImage(map: L.Map, options: MapExportOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Get map container
      const mapContainer = map.getContainer();
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = options.width;
      canvas.height = options.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Convert map to image (simplified implementation)
      // In a real implementation, you'd use libraries like html2canvas or leaflet-image
      const dataUrl = canvas.toDataURL(`image/${options.format}`, options.quality);
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
}

// Clustering utilities
export function shouldClusterMarkers(zoom: number, markerCount: number): boolean {
  // Cluster when zoomed out and there are many markers
  return zoom < 10 && markerCount > 20;
}

export function getClusterIcon(count: number, color: string = '#3b82f6'): L.DivIcon {
  const size = Math.min(40, Math.max(20, 20 + Math.log(count) * 5));
  
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${Math.max(10, size * 0.4)}px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${count}
      </div>
    `,
    className: 'marker-cluster',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

// Coordinate utilities
export function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}

// Measurement formatting
export function formatDistance(distance: number, unit: 'km' | 'mi' = 'km'): string {
  if (unit === 'mi') {
    distance = distance * 0.621371; // Convert km to miles
  }
  
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)} ${unit === 'km' ? 'm' : 'ft'}`;
  }
  
  return `${distance.toFixed(2)} ${unit}`;
}

export function formatArea(area: number, unit: 'km' | 'mi' = 'km'): string {
  if (unit === 'mi') {
    area = area * 0.386102; // Convert km² to mi²
  }
  
  return `${area.toFixed(2)} ${unit}²`;
}
