import { Location, EnhancedLocation, LocationType } from '@/types';

/**
 * Migration utility to convert old Location objects to new EnhancedLocation format
 */

// Map old location types to new hierarchical types
const mapLocationTypeToHierarchical = (oldType: string): LocationType => {
  switch (oldType) {
    case 'settlement':
      return 'city'; // Default settlements to cities
    case 'dungeon':
      return 'dungeon';
    case 'landmark':
      return 'monument';
    case 'wilderness':
      return 'forest'; // Default wilderness to forest
    case 'structure':
      return 'building';
    default:
      return 'landmark';
  }
};

// Determine hierarchy level based on location type
const getHierarchyLevel = (type: LocationType): number => {
  switch (type) {
    case 'continent':
    case 'region':
      return 0;
    case 'country':
    case 'kingdom':
      return 1;
    case 'province':
    case 'state':
      return 2;
    case 'city':
      return 3;
    case 'town':
      return 4;
    case 'village':
      return 5;
    case 'district':
    case 'neighborhood':
      return 6;
    case 'building':
    case 'establishment':
      return 7;
    default:
      return 3; // Default to city level
  }
};

// Generate default enhanced data based on location type and existing data
const generateDefaultEnhancedData = (location: any, newType: LocationType) => {
  const defaultGeography = {
    terrain: 'Mixed terrain',
    topography: 'Varied',
    naturalFeatures: [],
    climateZone: location.climate || 'Temperate',
    flora: [],
    fauna: [],
    naturalResources: [],
    weatherPatterns: 'Seasonal variations',
    naturalDisasters: []
  };

  const defaultArchitecture = {
    buildingStyles: ['Traditional'],
    materials: ['Stone', 'Wood'],
    cityLayout: 'Organic growth',
    fortifications: 'Basic walls',
    notableBuildings: []
  };

  const defaultPolitics = {
    governmentType: location.government || 'Local council',
    rulers: [],
    laws: ['Basic civil laws'],
    conflicts: [],
    alliances: [],
    politicalStatus: 'Stable'
  };

  const defaultEconomy = {
    tradeGoods: [],
    currency: 'Gold pieces',
    markets: [],
    guilds: [],
    industries: [],
    economicStatus: location.economy || 'Moderate'
  };

  const defaultCulture = {
    demographics: ['Mixed population'],
    languages: ['Common'],
    customs: [],
    festivals: [],
    religions: [],
    socialStructure: 'Traditional hierarchy'
  };

  const defaultClimate = {
    temperatureRange: 'Moderate',
    seasons: ['Spring', 'Summer', 'Autumn', 'Winter'],
    precipitation: 'Regular rainfall',
    weatherEvents: []
  };

  return {
    geography: defaultGeography,
    architecture: defaultArchitecture,
    politics: defaultPolitics,
    economy: defaultEconomy,
    culture: defaultCulture,
    climate: defaultClimate
  };
};

/**
 * Migrate a single location from old format to new enhanced format
 */
export function migrateLocation(oldLocation: any): EnhancedLocation {
  const newType = mapLocationTypeToHierarchical(oldLocation.type);
  const enhancedData = generateDefaultEnhancedData(oldLocation, newType);

  const migratedLocation: EnhancedLocation = {
    id: oldLocation.id,
    campaignId: oldLocation.campaignId,
    name: oldLocation.name,
    type: newType,
    coords: oldLocation.coords || { lat: 0, lng: 0 },
    description: oldLocation.description || '',
    detailedDescription: oldLocation.detailedDescription || oldLocation.description || '',

    // Hierarchical structure
    parentLocationId: oldLocation.parentLocationId,
    subLocations: oldLocation.subLocations || [],
    hierarchyLevel: getHierarchyLevel(newType),
    
    // Enhanced data
    ...enhancedData,
    
    // Story elements
    history: oldLocation.history || '',
    legends: [],
    rumors: oldLocation.rumors || [],
    secrets: oldLocation.secrets || [],
    notableFeatures: [],
    magicalProperties: [],
    
    // Population and size
    population: oldLocation.population || 0,
    size: oldLocation.population > 100000 ? 'huge' : 
          oldLocation.population > 50000 ? 'large' :
          oldLocation.population > 10000 ? 'medium' :
          oldLocation.population > 1000 ? 'small' : 'tiny',
    
    // Associated entities
    npcs: oldLocation.npcs || [],
    quests: oldLocation.quests || [],
    images: oldLocation.images || [],
    
    // Metadata
    createdAt: oldLocation.createdAt || new Date(),
    updatedAt: oldLocation.updatedAt || new Date()
  };

  return migratedLocation;
}

/**
 * Migrate an array of locations from old format to new enhanced format
 */
export function migrateLocations(oldLocations: Location[]): EnhancedLocation[] {
  return oldLocations.map(migrateLocation);
}

/**
 * Create sample hierarchical locations for a campaign
 */
export function createSampleHierarchicalLocations(campaignId: string): EnhancedLocation[] {
  const now = new Date();
  
  const sampleLocations: EnhancedLocation[] = [
    // Continent level
    {
      id: `${campaignId}_continent_1`,
      campaignId,
      name: 'Aethermoor',
      type: 'continent',
      coords: { lat: 0, lng: 0 },
      description: 'A vast continent filled with diverse kingdoms, ancient forests, and mystical mountains.',
      detailedDescription: 'Aethermoor stretches across thousands of miles, encompassing everything from the frozen northern wastes to the tropical southern islands. Ancient magic flows through the land, creating wonders and dangers in equal measure.',
      parentLocationId: undefined,
      subLocations: [`${campaignId}_kingdom_1`, `${campaignId}_kingdom_2`],
      hierarchyLevel: 0,
      geography: {
        terrain: 'Diverse continental landmass',
        topography: 'Mountains, plains, forests, coastlines',
        naturalFeatures: ['The Dragonspine Mountains', 'Whispering Woods', 'Crystal Bay'],
        climateZone: 'Varied - Arctic to Tropical',
        flora: ['Ancient oaks', 'Silverleaf trees', 'Moonflowers'],
        fauna: ['Dragons', 'Dire wolves', 'Phoenix'],
        naturalResources: ['Mithril', 'Dragonstone', 'Arcane crystals'],
        weatherPatterns: 'Seasonal with magical influences',
        naturalDisasters: ['Mana storms', 'Dragon migrations']
      },
      architecture: {
        buildingStyles: ['Ancient elven', 'Dwarven stonework', 'Human settlements'],
        materials: ['Enchanted stone', 'Ironwood', 'Crystal'],
        cityLayout: 'Varies by region',
        fortifications: 'Ancient ward stones',
        notableBuildings: ['The Great Library', 'Tower of Mages']
      },
      politics: {
        governmentType: 'Continental alliance',
        rulers: ['High King Aldric', 'Queen Elaria'],
        laws: ['Continental Accords', 'Magic Regulation Acts'],
        conflicts: ['Border disputes', 'Resource conflicts'],
        alliances: ['The Northern Pact', 'Southern Trade Alliance'],
        politicalStatus: 'Stable but tense'
      },
      economy: {
        tradeGoods: ['Magical artifacts', 'Rare metals', 'Exotic spices'],
        currency: 'Continental gold standard',
        markets: ['Grand Bazaar', 'Mage Markets'],
        guilds: ['Merchants Guild', 'Adventurers Guild'],
        industries: ['Mining', 'Magic item crafting', 'Agriculture'],
        economicStatus: 'Prosperous'
      },
      culture: {
        demographics: ['Humans 40%', 'Elves 25%', 'Dwarves 20%', 'Others 15%'],
        languages: ['Common', 'Elvish', 'Dwarvish', 'Draconic'],
        customs: ['Seasonal festivals', 'Honor duels', 'Magic ceremonies'],
        festivals: ['Midsummer Celebration', 'Harvest Moon Festival'],
        religions: ['The Old Gods', 'Church of Light', 'Nature Spirits'],
        socialStructure: 'Feudal with magical aristocracy'
      },
      climate: {
        temperatureRange: 'Varies by region',
        seasons: ['Spring', 'Summer', 'Autumn', 'Winter'],
        precipitation: 'Regional variations',
        weatherEvents: ['Magical storms', 'Aurora displays']
      },
      history: 'Founded after the Great Sundering, when the ancient empire collapsed and new kingdoms rose from its ashes.',
      legends: ['The Dragon Wars', 'The Lost City of Arcanum'],
      rumors: ['Ancient treasures hidden in the mountains', 'A new dragon has been spotted'],
      secrets: ['The location of the last Dragon Egg', 'Secret passages between kingdoms'],
      notableFeatures: ['The Worldtree', 'Floating islands', 'Time-distorted zones'],
      magicalProperties: ['Ley line convergence', 'Natural mana wells'],
      population: 50000000,
      size: 'massive',
      npcs: [],
      quests: [],
      images: [],
      createdAt: now,
      updatedAt: now
    },
    
    // Kingdom level
    {
      id: `${campaignId}_kingdom_1`,
      campaignId,
      name: 'Kingdom of Valenhall',
      type: 'kingdom',
      coords: { lat: 45.5, lng: -73.6 },
      description: 'A prosperous human kingdom known for its knights, trade, and magical academies.',
      detailedDescription: 'Valenhall stands as a beacon of civilization in Aethermoor, with gleaming cities, well-maintained roads, and a strong military tradition. The kingdom is ruled by a just monarch and protected by the legendary Knights of the Silver Rose.',
      parentLocationId: `${campaignId}_continent_1`,
      subLocations: [`${campaignId}_city_1`, `${campaignId}_city_2`],
      hierarchyLevel: 1,
      geography: {
        terrain: 'Rolling hills and fertile plains',
        topography: 'Gentle hills, river valleys, coastal regions',
        naturalFeatures: ['River Silverflow', 'Golden Plains', 'Sunset Cliffs'],
        climateZone: 'Temperate',
        flora: ['Wheat fields', 'Apple orchards', 'Rose gardens'],
        fauna: ['Horses', 'Cattle', 'Songbirds'],
        naturalResources: ['Iron', 'Gold', 'Fertile soil'],
        weatherPatterns: 'Mild seasons with regular rainfall',
        naturalDisasters: ['Occasional floods', 'Rare storms']
      },
      architecture: {
        buildingStyles: ['Gothic', 'Renaissance', 'Classical'],
        materials: ['White stone', 'Oak timber', 'Stained glass'],
        cityLayout: 'Planned cities with central squares',
        fortifications: 'Stone walls and towers',
        notableBuildings: ['Royal Palace', 'Grand Cathedral', 'Academy of Magic']
      },
      politics: {
        governmentType: 'Constitutional monarchy',
        rulers: ['King Aldric the Just'],
        laws: ['Royal Decree', 'Common Law', 'Guild Regulations'],
        conflicts: ['Border skirmishes with neighboring kingdoms'],
        alliances: ['Trade pact with Elvish realms'],
        politicalStatus: 'Stable and prosperous'
      },
      economy: {
        tradeGoods: ['Grain', 'Textiles', 'Weapons', 'Magical components'],
        currency: 'Valenhall gold crowns',
        markets: ['Capital Market', 'Merchant Quarter'],
        guilds: ['Smiths Guild', 'Mages Guild', 'Merchants Guild'],
        industries: ['Agriculture', 'Crafting', 'Magic research'],
        economicStatus: 'Very prosperous'
      },
      culture: {
        demographics: ['Humans 85%', 'Halflings 10%', 'Others 5%'],
        languages: ['Common', 'Old Valenhall'],
        customs: ['Knightly codes', 'Royal ceremonies', 'Guild traditions'],
        festivals: ['Founding Day', 'Harvest Festival', 'Knights Tournament'],
        religions: ['Church of Light', 'Nature worship'],
        socialStructure: 'Feudal nobility with merchant class'
      },
      climate: {
        temperatureRange: 'Mild to warm',
        seasons: ['Mild spring', 'Warm summer', 'Cool autumn', 'Gentle winter'],
        precipitation: 'Regular rainfall',
        weatherEvents: ['Spring storms', 'Summer droughts']
      },
      history: 'Founded 500 years ago by King Valen the Great after uniting the warring tribes of the region.',
      legends: ['The Silver Rose Knights', 'The Lost Crown of Valen'],
      rumors: ['The king is planning a grand tournament', 'Strange lights seen in the northern forests'],
      secrets: ['Hidden royal bloodline', 'Secret alliance with dragons'],
      notableFeatures: ['The Royal Road', 'Academy towers', 'Knight training grounds'],
      magicalProperties: ['Blessed by ancient rituals', 'Protected by ward stones'],
      population: 5000000,
      size: 'huge',
      npcs: [],
      quests: [],
      images: [],
      createdAt: now,
      updatedAt: now
    }
  ];

  return sampleLocations;
}
