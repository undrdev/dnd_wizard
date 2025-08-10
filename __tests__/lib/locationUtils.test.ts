import {
  enhanceLocation,
  validateLocationData,
  filterLocationsBySearch,
  filterLocationsByCriteria,
  sortLocations,
  buildLocationHierarchy,
  createLocationImage,
  getLocationBreadcrumb,
  getDescendantLocations,
  canMoveLocation,
} from '@/lib/locationUtils';
import type { Location, EnhancedLocation, LocationFilterCriteria } from '@/types';

// Mock data
const mockLocation: Location = {
  id: '1',
  campaignId: 'campaign1',
  name: 'Test City',
  type: 'city',
  coords: { lat: 40.7128, lng: -74.0060 },
  description: 'A test city',
  npcs: [],
  quests: [],
};

const mockEnhancedLocation: EnhancedLocation = {
  ...mockLocation,
  parentLocationId: undefined,
  subLocations: [],
  images: [],
  detailedDescription: 'A detailed description',
  history: 'Ancient history',
  rumors: ['Rumor 1', 'Rumor 2'],
  secrets: ['Secret 1'],
  climate: 'Temperate',
  population: 100000,
  government: 'Democracy',
  economy: 'Trade',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-02'),
};

describe('locationUtils', () => {
  describe('enhanceLocation', () => {
    it('should enhance a basic location with additional fields', () => {
      const enhanced = enhanceLocation(mockLocation);
      
      expect(enhanced.id).toBe(mockLocation.id);
      expect(enhanced.name).toBe(mockLocation.name);
      expect(enhanced.parentLocationId).toBeUndefined();
      expect(enhanced.subLocations).toEqual([]);
      expect(enhanced.images).toEqual([]);
      expect(enhanced.detailedDescription).toBe(mockLocation.description);
      expect(enhanced.history).toBe('');
      expect(enhanced.rumors).toEqual([]);
      expect(enhanced.secrets).toEqual([]);
      expect(enhanced.climate).toBe('');
    });
  });

  describe('validateLocationData', () => {
    it('should validate valid location data', () => {
      const result = validateLocationData(mockEnhancedLocation);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject location without name', () => {
      const invalidLocation = { ...mockEnhancedLocation, name: '' };
      const result = validateLocationData(invalidLocation);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Location name is required');
    });

    it('should reject location without type', () => {
      const invalidLocation = { ...mockEnhancedLocation, type: undefined as any };
      const result = validateLocationData(invalidLocation);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Location type is required');
    });

    it('should reject location with invalid coordinates', () => {
      const invalidLocation = { ...mockEnhancedLocation, coords: { lat: 100, lng: 200 } };
      const result = validateLocationData(invalidLocation);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Latitude must be between -90 and 90');
      expect(result.errors).toContain('Longitude must be between -180 and 180');
    });

    it('should reject location with negative population', () => {
      const invalidLocation = { ...mockEnhancedLocation, population: -100 };
      const result = validateLocationData(invalidLocation);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Population cannot be negative');
    });
  });

  describe('filterLocationsBySearch', () => {
    const locations = [
      { ...mockEnhancedLocation, name: 'New York', description: 'Big city' },
      { ...mockEnhancedLocation, id: '2', name: 'London', description: 'Historic city' },
      { ...mockEnhancedLocation, id: '3', name: 'Tokyo', description: 'Modern metropolis' },
    ];

    it('should return all locations when search term is empty', () => {
      const result = filterLocationsBySearch(locations, '');
      expect(result).toEqual(locations);
    });

    it('should filter by name', () => {
      const result = filterLocationsBySearch(locations, 'New');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('New York');
    });

    it('should filter by description', () => {
      const result = filterLocationsBySearch(locations, 'Historic');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('London');
    });

    it('should be case insensitive', () => {
      const result = filterLocationsBySearch(locations, 'TOKYO');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Tokyo');
    });
  });

  describe('filterLocationsByCriteria', () => {
    const locations = [
      { ...mockEnhancedLocation, type: 'city' as const, population: 100000 },
      { ...mockEnhancedLocation, id: '2', type: 'village' as const, population: 5000 },
      { ...mockEnhancedLocation, id: '3', type: 'landmark' as const, population: undefined },
    ];

    it('should filter by type', () => {
      const criteria: LocationFilterCriteria = { type: ['city'] };
      const result = filterLocationsByCriteria(locations, criteria);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('city');
    });

    it('should filter by population range', () => {
      const criteria: LocationFilterCriteria = { 
        populationRange: { min: 10000, max: 200000 } 
      };
      const result = filterLocationsByCriteria(locations, criteria);
      expect(result).toHaveLength(1);
      expect(result[0].population).toBe(100000);
    });

    it('should filter by multiple criteria', () => {
      const criteria: LocationFilterCriteria = { 
        type: ['city', 'village'],
        populationRange: { min: 1000 }
      };
      const result = filterLocationsByCriteria(locations, criteria);
      expect(result).toHaveLength(2);
    });
  });

  describe('sortLocations', () => {
    const locations = [
      { ...mockEnhancedLocation, name: 'Charlie', population: 50000 },
      { ...mockEnhancedLocation, id: '2', name: 'Alpha', population: 100000 },
      { ...mockEnhancedLocation, id: '3', name: 'Beta', population: 25000 },
    ];

    it('should sort by name ascending', () => {
      const result = sortLocations(locations, 'name', true);
      expect(result.map(l => l.name)).toEqual(['Alpha', 'Beta', 'Charlie']);
    });

    it('should sort by name descending', () => {
      const result = sortLocations(locations, 'name', false);
      expect(result.map(l => l.name)).toEqual(['Charlie', 'Beta', 'Alpha']);
    });

    it('should sort by population ascending', () => {
      const result = sortLocations(locations, 'population', true);
      expect(result.map(l => l.population)).toEqual([25000, 50000, 100000]);
    });

    it('should sort by population descending', () => {
      const result = sortLocations(locations, 'population', false);
      expect(result.map(l => l.population)).toEqual([100000, 50000, 25000]);
    });
  });

  describe('buildLocationHierarchy', () => {
    const parentLocation = { ...mockEnhancedLocation, id: 'parent', name: 'Parent' };
    const childLocation = { 
      ...mockEnhancedLocation, 
      id: 'child', 
      name: 'Child', 
      parentLocationId: 'parent' 
    };
    const grandchildLocation = { 
      ...mockEnhancedLocation, 
      id: 'grandchild', 
      name: 'Grandchild', 
      parentLocationId: 'child' 
    };

    // Update parent's subLocations
    parentLocation.subLocations = ['child'];
    childLocation.subLocations = ['grandchild'];

    const locations = [parentLocation, childLocation, grandchildLocation];

    it('should build correct hierarchy', () => {
      const hierarchy = buildLocationHierarchy(locations);
      
      expect(hierarchy).toHaveLength(1);
      expect(hierarchy[0].location.name).toBe('Parent');
      expect(hierarchy[0].depth).toBe(0);
      expect(hierarchy[0].children).toHaveLength(1);
      expect(hierarchy[0].children[0].location.name).toBe('Child');
      expect(hierarchy[0].children[0].depth).toBe(1);
      expect(hierarchy[0].children[0].children).toHaveLength(1);
      expect(hierarchy[0].children[0].children[0].location.name).toBe('Grandchild');
      expect(hierarchy[0].children[0].children[0].depth).toBe(2);
    });
  });

  describe('createLocationImage', () => {
    it('should create a location image with default values', () => {
      const image = createLocationImage('https://example.com/image.jpg');
      
      expect(image.url).toBe('https://example.com/image.jpg');
      expect(image.caption).toBe('');
      expect(image.isPrimary).toBe(false);
      expect(image.id).toBeDefined();
      expect(image.uploadedAt).toBeInstanceOf(Date);
    });

    it('should create a location image with custom values', () => {
      const image = createLocationImage(
        'https://example.com/image.jpg',
        'Test caption',
        true
      );
      
      expect(image.url).toBe('https://example.com/image.jpg');
      expect(image.caption).toBe('Test caption');
      expect(image.isPrimary).toBe(true);
    });
  });

  describe('getLocationBreadcrumb', () => {
    const grandparent = { ...mockEnhancedLocation, id: 'grandparent', name: 'Grandparent' };
    const parent = { 
      ...mockEnhancedLocation, 
      id: 'parent', 
      name: 'Parent', 
      parentLocationId: 'grandparent' 
    };
    const child = { 
      ...mockEnhancedLocation, 
      id: 'child', 
      name: 'Child', 
      parentLocationId: 'parent' 
    };

    const locations = [grandparent, parent, child];

    it('should return correct breadcrumb path', () => {
      const breadcrumb = getLocationBreadcrumb(child, locations);
      
      expect(breadcrumb).toHaveLength(3);
      expect(breadcrumb[0].name).toBe('Grandparent');
      expect(breadcrumb[1].name).toBe('Parent');
      expect(breadcrumb[2].name).toBe('Child');
    });

    it('should return single item for root location', () => {
      const breadcrumb = getLocationBreadcrumb(grandparent, locations);
      
      expect(breadcrumb).toHaveLength(1);
      expect(breadcrumb[0].name).toBe('Grandparent');
    });
  });

  describe('canMoveLocation', () => {
    const parent = {
      ...mockEnhancedLocation,
      id: 'parent',
      name: 'Parent',
      subLocations: ['child']
    };
    const child = {
      ...mockEnhancedLocation,
      id: 'child',
      name: 'Child',
      parentLocationId: 'parent',
      subLocations: ['grandchild']
    };
    const grandchild = {
      ...mockEnhancedLocation,
      id: 'grandchild',
      name: 'Grandchild',
      parentLocationId: 'child',
      subLocations: []
    };

    const locations = [parent, child, grandchild];

    it('should allow moving to unrelated location', () => {
      const canMove = canMoveLocation('grandchild', 'parent', locations);
      expect(canMove).toBe(true);
    });

    it('should prevent moving to self', () => {
      const canMove = canMoveLocation('parent', 'parent', locations);
      expect(canMove).toBe(false);
    });

    it('should prevent circular references', () => {
      const canMove = canMoveLocation('parent', 'grandchild', locations);
      expect(canMove).toBe(false);
    });
  });
});
