import type {
  Location,
  EnhancedLocation,
  LocationImage,
  LocationFilterCriteria,
  LocationSortBy,
  LocationHierarchyNode,
  CreateEnhancedLocationData,
} from '@/types';

/**
 * Enhance a basic Location with additional fields for enhanced functionality
 */
export function enhanceLocation(location: Location): EnhancedLocation {
  return {
    ...location,
    parentLocationId: undefined,
    subLocations: [],
    hierarchyLevel: 3,
    images: [],
    detailedDescription: location.description || '',

    // Enhanced data structures
    geography: {
      terrain: 'Mixed',
      topography: 'Varied',
      naturalFeatures: [],
      climateZone: 'Temperate',
      flora: [],
      fauna: [],
      naturalResources: [],
      weatherPatterns: 'Seasonal',
      naturalDisasters: []
    },
    architecture: {
      buildingStyles: [],
      materials: [],
      cityLayout: 'Organic',
      fortifications: 'Basic',
      notableBuildings: []
    },
    politics: {
      governmentType: 'Local council',
      rulers: [],
      laws: [],
      conflicts: [],
      alliances: [],
      politicalStatus: 'Stable'
    },
    economy: {
      tradeGoods: [],
      currency: 'Gold pieces',
      markets: [],
      guilds: [],
      industries: [],
      economicStatus: 'Moderate'
    },
    culture: {
      demographics: [],
      languages: ['Common'],
      customs: [],
      festivals: [],
      religions: [],
      socialStructure: 'Traditional'
    },
    climate: {
      temperatureRange: 'Moderate',
      seasons: ['Spring', 'Summer', 'Autumn', 'Winter'],
      precipitation: 'Regular',
      weatherEvents: []
    },

    // Story elements
    history: '',
    legends: [],
    rumors: [],
    secrets: [],
    notableFeatures: [],
    magicalProperties: [],

    // Population and size
    population: 0,
    size: 'medium',

    // Metadata
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Validate location data before creation/update
 */
export function validateLocationData(data: Partial<EnhancedLocation>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push('Location name is required');
  }

  if (!data.type) {
    errors.push('Location type is required');
  }

  if (!data.coords || typeof data.coords.lat !== 'number' || typeof data.coords.lng !== 'number') {
    errors.push('Valid coordinates are required');
  }

  if (data.coords) {
    if (data.coords.lat < -90 || data.coords.lat > 90) {
      errors.push('Latitude must be between -90 and 90');
    }
    if (data.coords.lng < -180 || data.coords.lng > 180) {
      errors.push('Longitude must be between -180 and 180');
    }
  }

  if (data.population !== undefined && data.population < 0) {
    errors.push('Population cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Filter locations by search term
 */
export function filterLocationsBySearch(
  locations: EnhancedLocation[],
  searchTerm: string
): EnhancedLocation[] {
  if (!searchTerm.trim()) return locations;

  const term = searchTerm.toLowerCase();
  return locations.filter(location =>
    location.name.toLowerCase().includes(term) ||
    location.description.toLowerCase().includes(term) ||
    location.detailedDescription.toLowerCase().includes(term) ||
    location.type.toLowerCase().includes(term) ||
    location.climate.temperatureRange.toLowerCase().includes(term) ||
    location.politics.governmentType.toLowerCase().includes(term) ||
    location.economy.economicStatus.toLowerCase().includes(term) ||
    location.history.toLowerCase().includes(term) ||
    location.rumors.some(rumor => rumor.toLowerCase().includes(term))
  );
}

/**
 * Filter locations by criteria
 */
export function filterLocationsByCriteria(
  locations: EnhancedLocation[],
  criteria: LocationFilterCriteria
): EnhancedLocation[] {
  return locations.filter(location => {
    // Filter by type
    if (criteria.type && criteria.type.length > 0) {
      if (!criteria.type.includes(location.type)) return false;
    }

    // Filter by parent location
    if (criteria.parentLocationId !== undefined) {
      if (location.parentLocationId !== criteria.parentLocationId) return false;
    }

    // Filter by sub-locations existence
    if (criteria.hasSubLocations !== undefined) {
      const hasSubLocations = location.subLocations.length > 0;
      if (criteria.hasSubLocations !== hasSubLocations) return false;
    }

    // Filter by images existence
    if (criteria.hasImages !== undefined) {
      const hasImages = location.images.length > 0;
      if (criteria.hasImages !== hasImages) return false;
    }

    // Filter by population range
    if (criteria.populationRange) {
      if (location.population === undefined) return false;
      if (criteria.populationRange.min !== undefined && location.population < criteria.populationRange.min) {
        return false;
      }
      if (criteria.populationRange.max !== undefined && location.population > criteria.populationRange.max) {
        return false;
      }
    }

    // Filter by climate
    if (criteria.climate && criteria.climate.length > 0) {
      if (!criteria.climate.includes(location.climate.temperatureRange)) return false;
    }

    return true;
  });
}

/**
 * Sort locations by specified criteria
 */
export function sortLocations(
  locations: EnhancedLocation[],
  sortBy: LocationSortBy,
  ascending: boolean = true
): EnhancedLocation[] {
  const sorted = [...locations].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'population':
        const popA = a.population || 0;
        const popB = b.population || 0;
        comparison = popA - popB;
        break;
      case 'createdAt':
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = dateA - dateB;
        break;
      case 'updatedAt':
        const updatedA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const updatedB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        comparison = updatedA - updatedB;
        break;
      case 'subLocationCount':
        comparison = a.subLocations.length - b.subLocations.length;
        break;
      default:
        comparison = 0;
    }

    return ascending ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Build location hierarchy tree
 */
export function buildLocationHierarchy(locations: EnhancedLocation[]): LocationHierarchyNode[] {
  const locationMap = new Map<string, EnhancedLocation>();
  const rootNodes: LocationHierarchyNode[] = [];

  // Create map for quick lookup
  locations.forEach(location => {
    locationMap.set(location.id, location);
  });

  // Build hierarchy
  const buildNode = (location: EnhancedLocation, depth: number = 0): LocationHierarchyNode => {
    const children: LocationHierarchyNode[] = [];
    
    location.subLocations.forEach(subLocationId => {
      const subLocation = locationMap.get(subLocationId);
      if (subLocation) {
        children.push(buildNode(subLocation, depth + 1));
      }
    });

    return {
      location,
      children,
      depth,
    };
  };

  // Find root locations (no parent)
  locations.forEach(location => {
    if (!location.parentLocationId) {
      rootNodes.push(buildNode(location));
    }
  });

  return rootNodes;
}

/**
 * Create a new location image
 */
export function createLocationImage(
  url: string,
  caption: string = '',
  isPrimary: boolean = false
): LocationImage {
  return {
    id: crypto.randomUUID(),
    url,
    caption,
    isPrimary,
    uploadedAt: new Date(),
  };
}

/**
 * Get location breadcrumb path
 */
export function getLocationBreadcrumb(
  location: EnhancedLocation,
  allLocations: EnhancedLocation[]
): EnhancedLocation[] {
  const breadcrumb: EnhancedLocation[] = [];
  let current: EnhancedLocation | undefined = location;

  while (current) {
    breadcrumb.unshift(current);
    current = current.parentLocationId 
      ? allLocations.find(loc => loc.id === current!.parentLocationId)
      : undefined;
  }

  return breadcrumb;
}

/**
 * Get all descendant locations
 */
export function getDescendantLocations(
  location: EnhancedLocation,
  allLocations: EnhancedLocation[]
): EnhancedLocation[] {
  const descendants: EnhancedLocation[] = [];
  
  const collectDescendants = (loc: EnhancedLocation) => {
    loc.subLocations.forEach(subLocationId => {
      const subLocation = allLocations.find(l => l.id === subLocationId);
      if (subLocation) {
        descendants.push(subLocation);
        collectDescendants(subLocation);
      }
    });
  };

  collectDescendants(location);
  return descendants;
}

/**
 * Check if location can be moved to a new parent (prevent circular references)
 */
export function canMoveLocation(
  locationId: string,
  newParentId: string,
  allLocations: EnhancedLocation[]
): boolean {
  const location = allLocations.find(loc => loc.id === locationId);
  if (!location) return false;

  // Can't move to itself
  if (locationId === newParentId) return false;

  // Can't move to one of its descendants
  const descendants = getDescendantLocations(location, allLocations);
  return !descendants.some(desc => desc.id === newParentId);
}
