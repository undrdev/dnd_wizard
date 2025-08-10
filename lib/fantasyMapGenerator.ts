/**
 * Fantasy Map Generator
 * Generates procedural fantasy world tiles based on campaign mapSeed
 */

import { Campaign } from '@/types';

export interface FantasyTileOptions {
  mapSeed: string;
  tileSize: number;
  biomeVariety: number;
  terrainComplexity: number;
}

export interface BiomeType {
  id: string;
  name: string;
  color: string;
  features: string[];
  probability: number;
}

// Fantasy biomes for D&D worlds
export const FANTASY_BIOMES: BiomeType[] = [
  {
    id: 'grasslands',
    name: 'Grasslands',
    color: '#7CB342',
    features: ['villages', 'roads', 'farms'],
    probability: 0.25
  },
  {
    id: 'forest',
    name: 'Enchanted Forest',
    color: '#2E7D32',
    features: ['ancient_trees', 'druid_groves', 'hidden_paths'],
    probability: 0.20
  },
  {
    id: 'mountains',
    name: 'Mountain Peaks',
    color: '#5D4037',
    features: ['dwarven_mines', 'dragon_lairs', 'high_passes'],
    probability: 0.15
  },
  {
    id: 'desert',
    name: 'Mystic Desert',
    color: '#FFA726',
    features: ['oases', 'ancient_ruins', 'nomad_camps'],
    probability: 0.10
  },
  {
    id: 'swamp',
    name: 'Shadowmere Swamp',
    color: '#558B2F',
    features: ['witch_huts', 'will_o_wisps', 'bog_creatures'],
    probability: 0.08
  },
  {
    id: 'tundra',
    name: 'Frozen Wastes',
    color: '#B0BEC5',
    features: ['ice_caves', 'frost_giants', 'aurora_magic'],
    probability: 0.07
  },
  {
    id: 'volcanic',
    name: 'Volcanic Lands',
    color: '#D32F2F',
    features: ['lava_flows', 'fire_elementals', 'obsidian_cliffs'],
    probability: 0.05
  },
  {
    id: 'ocean',
    name: 'Mystic Seas',
    color: '#1976D2',
    features: ['sea_monsters', 'underwater_cities', 'storm_magic'],
    probability: 0.10
  }
];

/**
 * Simple seeded random number generator
 */
class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    this.seed = this.hashString(seed);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

/**
 * Generate fantasy map tile URL based on coordinates and map seed
 */
export function generateFantasyTileUrl(
  x: number, 
  y: number, 
  z: number, 
  mapSeed: string
): string {
  // Create a unique seed for this tile
  const tileSeed = `${mapSeed}-${z}-${x}-${y}`;
  const rng = new SeededRandom(tileSeed);
  
  // Generate biome for this tile
  const biome = selectBiome(rng);
  
  // Generate tile as data URL with procedural content
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return generateFallbackTile(biome);
  }

  // Fill base color
  ctx.fillStyle = biome.color;
  ctx.fillRect(0, 0, 256, 256);

  // Add terrain features
  addTerrainFeatures(ctx, biome, rng);
  
  // Add fantasy elements
  addFantasyFeatures(ctx, biome, rng);

  return canvas.toDataURL();
}

/**
 * Select biome based on weighted probability
 */
function selectBiome(rng: SeededRandom): BiomeType {
  const random = rng.next();
  let cumulative = 0;
  
  for (const biome of FANTASY_BIOMES) {
    cumulative += biome.probability;
    if (random <= cumulative) {
      return biome;
    }
  }
  
  return FANTASY_BIOMES[0]; // Fallback to grasslands
}

/**
 * Add terrain features to the tile
 */
function addTerrainFeatures(
  ctx: CanvasRenderingContext2D, 
  biome: BiomeType, 
  rng: SeededRandom
): void {
  const featureCount = rng.nextInt(2, 6);
  
  for (let i = 0; i < featureCount; i++) {
    const x = rng.nextInt(0, 256);
    const y = rng.nextInt(0, 256);
    const size = rng.nextInt(10, 40);
    
    // Vary color slightly
    const variation = rng.nextInt(-30, 30);
    const color = adjustColor(biome.color, variation);
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fill();
  }
}

/**
 * Add fantasy-specific features
 */
function addFantasyFeatures(
  ctx: CanvasRenderingContext2D, 
  biome: BiomeType, 
  rng: SeededRandom
): void {
  // Add magical sparkles or special features
  const sparkleCount = rng.nextInt(3, 8);
  
  for (let i = 0; i < sparkleCount; i++) {
    const x = rng.nextInt(0, 256);
    const y = rng.nextInt(0, 256);
    
    ctx.fillStyle = '#FFD700'; // Gold sparkles
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Add biome-specific features
  if (biome.id === 'forest') {
    addTrees(ctx, rng);
  } else if (biome.id === 'mountains') {
    addMountainPeaks(ctx, rng);
  } else if (biome.id === 'ocean') {
    addWaves(ctx, rng);
  }
}

/**
 * Add tree symbols for forest biomes
 */
function addTrees(ctx: CanvasRenderingContext2D, rng: SeededRandom): void {
  const treeCount = rng.nextInt(5, 12);
  
  for (let i = 0; i < treeCount; i++) {
    const x = rng.nextInt(20, 236);
    const y = rng.nextInt(20, 236);
    
    // Draw simple tree
    ctx.fillStyle = '#4A4A4A'; // Trunk
    ctx.fillRect(x - 2, y, 4, 15);
    
    ctx.fillStyle = '#1B5E20'; // Leaves
    ctx.beginPath();
    ctx.arc(x, y - 5, 8, 0, 2 * Math.PI);
    ctx.fill();
  }
}

/**
 * Add mountain peaks
 */
function addMountainPeaks(ctx: CanvasRenderingContext2D, rng: SeededRandom): void {
  const peakCount = rng.nextInt(2, 5);
  
  for (let i = 0; i < peakCount; i++) {
    const x = rng.nextInt(30, 226);
    const y = rng.nextInt(50, 200);
    const height = rng.nextInt(30, 60);
    
    ctx.fillStyle = '#3E2723';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 15, y + height);
    ctx.lineTo(x + 15, y + height);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Add wave patterns for ocean biomes
 */
function addWaves(ctx: CanvasRenderingContext2D, rng: SeededRandom): void {
  const waveCount = rng.nextInt(8, 15);
  
  for (let i = 0; i < waveCount; i++) {
    const y = rng.nextInt(0, 256);
    
    ctx.strokeStyle = '#0D47A1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    
    for (let x = 0; x <= 256; x += 20) {
      const waveY = y + Math.sin(x * 0.1 + i) * 5;
      ctx.lineTo(x, waveY);
    }
    
    ctx.stroke();
  }
}

/**
 * Adjust color brightness
 */
function adjustColor(color: string, variation: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + variation));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + variation));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + variation));
  
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Generate fallback tile for when canvas is not available
 */
function generateFallbackTile(biome: BiomeType): string {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" fill="${biome.color}"/>
      <text x="128" y="128" text-anchor="middle" fill="white" font-size="16" font-family="Arial">
        ${biome.name}
      </text>
    </svg>
  `)}`;
}

/**
 * Get fantasy map theme configuration for a campaign
 */
export function getFantasyMapTheme(campaign: Campaign) {
  return {
    id: 'fantasy-procedural',
    name: `${campaign.title} World`,
    baseLayer: `fantasy://${campaign.mapSeed}`,
    markerStyle: {
      npc: { color: '#8b5cf6', size: 25, icon: '🧙', clusterColor: '#7c3aed' },
      quest: { color: '#f59e0b', size: 25, icon: '⚔️', clusterColor: '#d97706' },
      location: { color: '#ef4444', size: 30, icon: '🏰', clusterColor: '#dc2626' }
    }
  };
}
