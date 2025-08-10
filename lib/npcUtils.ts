import type { NPC, EnhancedNPC, NPCRelationship } from '@/types';

// Default values for enhanced NPC fields
export const createEnhancedNPCDefaults = (): Partial<EnhancedNPC> => ({
  relationships: [],
  notes: '',
  backstory: '',
  goals: [],
  secrets: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Convert basic NPC to enhanced NPC
export const enhanceNPC = (npc: NPC): EnhancedNPC => ({
  ...npc,
  relationships: [],
  notes: '',
  backstory: '',
  goals: [],
  secrets: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Validate NPC data
export const validateNPCData = (data: Partial<EnhancedNPC>): string[] => {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push('Name is required');
  }

  if (!data.role?.trim()) {
    errors.push('Role is required');
  }

  if (!data.locationId?.trim()) {
    errors.push('Location is required');
  }

  return errors;
};

// Validate relationship data
export const validateRelationship = (
  relationship: Partial<NPCRelationship>,
  allNPCs: EnhancedNPC[]
): string[] => {
  const errors: string[] = [];

  if (!relationship.targetNpcId) {
    errors.push('Target NPC is required');
  } else if (!allNPCs.find(npc => npc.id === relationship.targetNpcId)) {
    errors.push('Target NPC does not exist');
  }

  if (!relationship.type) {
    errors.push('Relationship type is required');
  }

  if (relationship.strength === undefined || relationship.strength < 1 || relationship.strength > 10) {
    errors.push('Relationship strength must be between 1 and 10');
  }

  if (!relationship.description?.trim()) {
    errors.push('Relationship description is required');
  }

  return errors;
};

// Get relationship type display name
export const getRelationshipTypeDisplay = (type: NPCRelationship['type']): string => {
  const typeMap: Record<NPCRelationship['type'], string> = {
    ally: 'Ally',
    enemy: 'Enemy',
    neutral: 'Neutral',
    romantic: 'Romantic',
    family: 'Family',
    business: 'Business',
  };
  return typeMap[type] || type;
};

// Get relationship strength display
export const getRelationshipStrengthDisplay = (strength: number): string => {
  if (strength >= 9) return 'Very Strong';
  if (strength >= 7) return 'Strong';
  if (strength >= 5) return 'Moderate';
  if (strength >= 3) return 'Weak';
  return 'Very Weak';
};

// Filter NPCs by search term
export const filterNPCsBySearch = (npcs: EnhancedNPC[], searchTerm: string): EnhancedNPC[] => {
  if (!searchTerm.trim()) return npcs;

  const term = searchTerm.toLowerCase();
  return npcs.filter(npc =>
    npc.name.toLowerCase().includes(term) ||
    npc.role.toLowerCase().includes(term) ||
    npc.personality.toLowerCase().includes(term) ||
    npc.notes.toLowerCase().includes(term) ||
    npc.backstory.toLowerCase().includes(term)
  );
};

// Filter NPCs by criteria
export interface NPCFilterCriteria {
  locationId?: string;
  relationshipType?: NPCRelationship['type'];
  hasPortrait?: boolean;
  hasRelationships?: boolean;
}

export const filterNPCsByCriteria = (
  npcs: EnhancedNPC[],
  criteria: NPCFilterCriteria
): EnhancedNPC[] => {
  return npcs.filter(npc => {
    if (criteria.locationId && npc.locationId !== criteria.locationId) {
      return false;
    }

    if (criteria.hasPortrait !== undefined) {
      const hasPortrait = !!npc.portraitUrl;
      if (criteria.hasPortrait !== hasPortrait) {
        return false;
      }
    }

    if (criteria.hasRelationships !== undefined) {
      const hasRelationships = npc.relationships.length > 0;
      if (criteria.hasRelationships !== hasRelationships) {
        return false;
      }
    }

    if (criteria.relationshipType) {
      const hasRelationshipType = npc.relationships.some(
        rel => rel.type === criteria.relationshipType
      );
      if (!hasRelationshipType) {
        return false;
      }
    }

    return true;
  });
};

// Sort NPCs by different criteria
export type NPCSortBy = 'name' | 'role' | 'location' | 'createdAt' | 'updatedAt';

export const sortNPCs = (
  npcs: EnhancedNPC[],
  sortBy: NPCSortBy,
  ascending: boolean = true
): EnhancedNPC[] => {
  const sorted = [...npcs].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'role':
        comparison = a.role.localeCompare(b.role);
        break;
      case 'location':
        comparison = a.locationId.localeCompare(b.locationId);
        break;
      case 'createdAt':
        comparison = (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
        break;
      case 'updatedAt':
        comparison = (a.updatedAt?.getTime() || 0) - (b.updatedAt?.getTime() || 0);
        break;
    }

    return ascending ? comparison : -comparison;
  });

  return sorted;
};

// Generate NPC stats based on role
export const generateNPCStats = (role: string): Record<string, any> => {
  const baseStats = {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  };

  // Adjust stats based on role
  const roleAdjustments: Record<string, Partial<typeof baseStats>> = {
    warrior: { strength: 15, constitution: 14, dexterity: 12 },
    mage: { intelligence: 15, wisdom: 13, charisma: 12 },
    rogue: { dexterity: 15, intelligence: 12, charisma: 13 },
    cleric: { wisdom: 15, charisma: 13, constitution: 12 },
    merchant: { charisma: 14, intelligence: 12, wisdom: 11 },
    guard: { strength: 13, constitution: 13, dexterity: 11 },
    noble: { charisma: 14, intelligence: 12, wisdom: 10 },
    commoner: { constitution: 11, wisdom: 11 },
  };

  const adjustments = roleAdjustments[role.toLowerCase()] || {};
  return { ...baseStats, ...adjustments };
};

// Create a new relationship
export const createRelationship = (
  targetNpcId: string,
  type: NPCRelationship['type'],
  strength: number,
  description: string
): NPCRelationship => ({
  id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  targetNpcId,
  type,
  strength,
  description,
  createdAt: new Date(),
});

// Get mutual relationships between two NPCs
export const getMutualRelationships = (
  npc1: EnhancedNPC,
  npc2: EnhancedNPC
): { npc1ToNpc2?: NPCRelationship; npc2ToNpc1?: NPCRelationship } => {
  const npc1ToNpc2 = npc1.relationships.find(rel => rel.targetNpcId === npc2.id);
  const npc2ToNpc1 = npc2.relationships.find(rel => rel.targetNpcId === npc1.id);

  return { npc1ToNpc2, npc2ToNpc1 };
};
