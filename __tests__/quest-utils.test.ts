import {
  validateQuestDependencies,
  calculateQuestProgress,
  filterQuests,
  sortQuests,
  canStartQuest,
  getDependentQuests,
  createMilestone,
} from '../lib/questUtils';
import type { EnhancedQuest, QuestSearchOptions } from '../types';

// Mock quest data
const mockQuests: EnhancedQuest[] = [
  {
    id: 'quest1',
    campaignId: 'campaign1',
    title: 'Find the Lost Sword',
    description: 'A legendary sword has been lost in the ancient ruins.',
    importance: 'high',
    status: 'completed',
    startNpcId: 'npc1',
    involvedNpcIds: ['npc1'],
    locationIds: ['loc1'],
    dependencies: [],
    milestones: [
      {
        id: 'milestone1',
        title: 'Enter the ruins',
        description: 'Find the entrance to the ancient ruins',
        completed: true,
        completedAt: new Date('2024-01-01'),
        order: 0,
      },
      {
        id: 'milestone2',
        title: 'Find the sword',
        description: 'Locate the legendary sword',
        completed: true,
        completedAt: new Date('2024-01-02'),
        order: 1,
      },
    ],
    xpReward: 1000,
    goldReward: 500,
    itemRewards: ['Legendary Sword'],
    completedAt: new Date('2024-01-02'),
    notes: 'DM notes',
    playerNotes: 'Player notes',
    createdAt: new Date('2023-12-31'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: 'quest2',
    campaignId: 'campaign1',
    title: 'Defeat the Dragon',
    description: 'A mighty dragon threatens the village.',
    importance: 'high',
    status: 'active',
    startNpcId: 'npc2',
    involvedNpcIds: ['npc2', 'npc3'],
    locationIds: ['loc2'],
    dependencies: ['quest1'],
    milestones: [
      {
        id: 'milestone3',
        title: 'Gather allies',
        description: 'Find brave warriors to help',
        completed: true,
        completedAt: new Date('2024-01-03'),
        order: 0,
      },
      {
        id: 'milestone4',
        title: 'Confront the dragon',
        description: 'Face the dragon in battle',
        completed: false,
        order: 1,
      },
    ],
    xpReward: 2000,
    goldReward: 1000,
    itemRewards: ['Dragon Scale Armor'],
    notes: 'Very dangerous quest',
    playerNotes: 'Bring fire resistance',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-03'),
  },
  {
    id: 'quest3',
    campaignId: 'campaign1',
    title: 'Rescue the Princess',
    description: 'The princess has been kidnapped by bandits.',
    importance: 'medium',
    status: 'active',
    startNpcId: 'npc4',
    involvedNpcIds: ['npc4'],
    locationIds: ['loc3'],
    dependencies: ['quest2'],
    milestones: [],
    xpReward: 800,
    goldReward: 300,
    itemRewards: [],
    notes: 'Time sensitive',
    playerNotes: 'Be stealthy',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

describe('Quest Utils', () => {
  describe('validateQuestDependencies', () => {
    it('should validate valid dependencies', () => {
      const result = validateQuestDependencies('quest2', ['quest1'], mockQuests);
      expect(result.isValid).toBe(true);
      expect(result.circularDependencies).toHaveLength(0);
    });

    it('should detect circular dependencies', () => {
      // Create a circular dependency: quest1 -> quest2 -> quest1
      const questsWithCircular = [
        { ...mockQuests[0], dependencies: ['quest2'] },
        ...mockQuests.slice(1),
      ];
      
      const result = validateQuestDependencies('quest1', ['quest2'], questsWithCircular);
      expect(result.isValid).toBe(false);
      expect(result.circularDependencies.length).toBeGreaterThan(0);
    });
  });

  describe('calculateQuestProgress', () => {
    it('should calculate progress correctly', () => {
      const progress = calculateQuestProgress(mockQuests[1], mockQuests);
      expect(progress.totalMilestones).toBe(2);
      expect(progress.completedMilestones).toBe(1);
      expect(progress.percentage).toBe(50);
      expect(progress.canComplete).toBe(true); // quest1 is completed
    });

    it('should handle quests with no milestones', () => {
      const progress = calculateQuestProgress(mockQuests[2], mockQuests);
      expect(progress.totalMilestones).toBe(0);
      expect(progress.completedMilestones).toBe(0);
      expect(progress.percentage).toBe(0);
      expect(progress.canComplete).toBe(false); // quest2 is not completed
    });
  });

  describe('filterQuests', () => {
    it('should filter by text search', () => {
      const options: QuestSearchOptions = { query: 'dragon' };
      const filtered = filterQuests(mockQuests, options);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Defeat the Dragon');
    });

    it('should filter by status', () => {
      const options: QuestSearchOptions = {
        filters: { status: ['completed'] }
      };
      const filtered = filterQuests(mockQuests, options);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe('completed');
    });

    it('should filter by importance', () => {
      const options: QuestSearchOptions = {
        filters: { importance: ['high'] }
      };
      const filtered = filterQuests(mockQuests, options);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(q => q.importance === 'high')).toBe(true);
    });

    it('should filter by rewards', () => {
      const options: QuestSearchOptions = {
        filters: { hasRewards: true }
      };
      const filtered = filterQuests(mockQuests, options);
      expect(filtered).toHaveLength(3); // All quests have rewards
    });

    it('should filter by dependencies', () => {
      const options: QuestSearchOptions = {
        filters: { hasDependencies: true }
      };
      const filtered = filterQuests(mockQuests, options);
      expect(filtered).toHaveLength(2); // quest2 and quest3 have dependencies
    });
  });

  describe('sortQuests', () => {
    it('should sort by title ascending', () => {
      const sorted = sortQuests(mockQuests, 'title', 'asc');
      expect(sorted[0].title).toBe('Defeat the Dragon');
      expect(sorted[1].title).toBe('Find the Lost Sword');
      expect(sorted[2].title).toBe('Rescue the Princess');
    });

    it('should sort by importance descending', () => {
      const sorted = sortQuests(mockQuests, 'importance', 'desc');
      expect(sorted[0].importance).toBe('high');
      expect(sorted[1].importance).toBe('high');
      expect(sorted[2].importance).toBe('medium');
    });

    it('should sort by status', () => {
      const sorted = sortQuests(mockQuests, 'status', 'asc');
      expect(sorted[0].status).toBe('active');
      expect(sorted[1].status).toBe('active');
      expect(sorted[2].status).toBe('completed');
    });
  });

  describe('canStartQuest', () => {
    it('should return true for quest with completed dependencies', () => {
      const canStart = canStartQuest(mockQuests[1], mockQuests);
      expect(canStart).toBe(true);
    });

    it('should return false for quest with incomplete dependencies', () => {
      const canStart = canStartQuest(mockQuests[2], mockQuests);
      expect(canStart).toBe(false);
    });

    it('should return true for quest with no dependencies', () => {
      const canStart = canStartQuest(mockQuests[0], mockQuests);
      expect(canStart).toBe(true);
    });
  });

  describe('getDependentQuests', () => {
    it('should find quests that depend on a given quest', () => {
      const dependents = getDependentQuests('quest1', mockQuests);
      expect(dependents).toHaveLength(1);
      expect(dependents[0].id).toBe('quest2');
    });

    it('should find multiple dependent quests', () => {
      const dependents = getDependentQuests('quest2', mockQuests);
      expect(dependents).toHaveLength(1);
      expect(dependents[0].id).toBe('quest3');
    });

    it('should return empty array for quest with no dependents', () => {
      const dependents = getDependentQuests('quest3', mockQuests);
      expect(dependents).toHaveLength(0);
    });
  });

  describe('createMilestone', () => {
    it('should create a milestone with default values', () => {
      const milestone = createMilestone('Test Milestone', 'Test description', 1);
      expect(milestone.title).toBe('Test Milestone');
      expect(milestone.description).toBe('Test description');
      expect(milestone.completed).toBe(false);
      expect(milestone.order).toBe(1);
      expect(milestone.completedAt).toBeUndefined();
    });

    it('should create a milestone with minimal parameters', () => {
      const milestone = createMilestone('Simple Milestone');
      expect(milestone.title).toBe('Simple Milestone');
      expect(milestone.description).toBe('');
      expect(milestone.completed).toBe(false);
      expect(milestone.order).toBe(0);
    });
  });
});
