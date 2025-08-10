import type {
  Quest,
  EnhancedQuest,
  QuestMilestone,
  QuestFilters,
  QuestSearchOptions,
  QuestProgress,
  QuestTimelineEvent,
  NPC,
  Location,
} from '@/types';

/**
 * Validates quest dependencies to prevent circular dependencies
 */
export function validateQuestDependencies(
  questId: string,
  dependencies: string[],
  allQuests: EnhancedQuest[]
): { isValid: boolean; circularDependencies: string[] } {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const circularDependencies: string[] = [];

  function hasCycle(currentQuestId: string): boolean {
    if (recursionStack.has(currentQuestId)) {
      circularDependencies.push(currentQuestId);
      return true;
    }
    if (visited.has(currentQuestId)) {
      return false;
    }

    visited.add(currentQuestId);
    recursionStack.add(currentQuestId);

    const quest = allQuests.find(q => q.id === currentQuestId);
    if (quest) {
      for (const depId of quest.dependencies) {
        if (hasCycle(depId)) {
          return true;
        }
      }
    }

    recursionStack.delete(currentQuestId);
    return false;
  }

  // Check if adding these dependencies would create a cycle
  const tempQuest: EnhancedQuest = {
    ...allQuests.find(q => q.id === questId) || {} as EnhancedQuest,
    id: questId,
    dependencies,
  };

  const questsWithTemp = allQuests.filter(q => q.id !== questId).concat(tempQuest);
  
  for (const depId of dependencies) {
    if (hasCycle(depId)) {
      return { isValid: false, circularDependencies };
    }
  }

  return { isValid: true, circularDependencies: [] };
}

/**
 * Calculates quest progress based on milestones and dependencies
 */
export function calculateQuestProgress(
  quest: EnhancedQuest,
  allQuests: EnhancedQuest[]
): QuestProgress {
  const totalMilestones = quest.milestones.length;
  const completedMilestones = quest.milestones.filter(m => m.completed).length;
  const percentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  // Check if all dependencies are completed
  const canComplete = quest.dependencies.every(depId => {
    const depQuest = allQuests.find(q => q.id === depId);
    return depQuest?.status === 'completed';
  });

  return {
    questId: quest.id,
    totalMilestones,
    completedMilestones,
    percentage,
    canComplete,
  };
}

/**
 * Generates timeline events for a quest
 */
export function generateQuestTimeline(
  quest: EnhancedQuest,
  allQuests: EnhancedQuest[]
): QuestTimelineEvent[] {
  const events: QuestTimelineEvent[] = [];

  // Quest created event
  if (quest.createdAt) {
    events.push({
      id: `${quest.id}-created`,
      questId: quest.id,
      type: 'created',
      title: 'Quest Created',
      description: `Quest "${quest.title}" was created`,
      timestamp: quest.createdAt,
    });
  }

  // Milestone completion events
  quest.milestones
    .filter(m => m.completed && m.completedAt)
    .forEach(milestone => {
      events.push({
        id: `${quest.id}-milestone-${milestone.id}`,
        questId: quest.id,
        type: 'milestone_completed',
        title: `Milestone Completed: ${milestone.title}`,
        description: milestone.description,
        timestamp: milestone.completedAt!,
        metadata: { milestoneId: milestone.id },
      });
    });

  // Quest completion event
  if (quest.status === 'completed' && quest.completedAt) {
    events.push({
      id: `${quest.id}-completed`,
      questId: quest.id,
      type: 'completed',
      title: 'Quest Completed',
      description: `Quest "${quest.title}" was completed`,
      timestamp: quest.completedAt,
    });
  }

  // Sort events by timestamp
  return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Filters and searches quests based on criteria
 */
export function filterQuests(
  quests: EnhancedQuest[],
  options: QuestSearchOptions,
  npcs: NPC[] = [],
  locations: Location[] = []
): EnhancedQuest[] {
  let filteredQuests = [...quests];

  // Text search
  if (options.query) {
    const query = options.query.toLowerCase();
    filteredQuests = filteredQuests.filter(quest => {
      const searchableText = [
        quest.title,
        quest.description,
        quest.notes || '',
        quest.playerNotes || '',
        ...quest.milestones.map(m => `${m.title} ${m.description}`),
      ].join(' ').toLowerCase();

      // Also search in related NPCs and locations
      const relatedNpcs = npcs.filter(npc => 
        quest.involvedNpcIds.includes(npc.id) || quest.startNpcId === npc.id
      );
      const relatedLocations = locations.filter(loc => 
        quest.locationIds.includes(loc.id)
      );

      const relatedText = [
        ...relatedNpcs.map(npc => `${npc.name} ${npc.role}`),
        ...relatedLocations.map(loc => `${loc.name} ${loc.description}`),
      ].join(' ').toLowerCase();

      return searchableText.includes(query) || relatedText.includes(query);
    });
  }

  // Apply filters
  if (options.filters) {
    const { filters } = options;

    if (filters.status && filters.status.length > 0) {
      filteredQuests = filteredQuests.filter(quest => 
        filters.status!.includes(quest.status)
      );
    }

    if (filters.importance && filters.importance.length > 0) {
      filteredQuests = filteredQuests.filter(quest => 
        filters.importance!.includes(quest.importance)
      );
    }

    if (filters.involvedNpcIds && filters.involvedNpcIds.length > 0) {
      filteredQuests = filteredQuests.filter(quest => 
        filters.involvedNpcIds!.some(npcId => 
          quest.involvedNpcIds.includes(npcId) || quest.startNpcId === npcId
        )
      );
    }

    if (filters.locationIds && filters.locationIds.length > 0) {
      filteredQuests = filteredQuests.filter(quest => 
        filters.locationIds!.some(locId => quest.locationIds.includes(locId))
      );
    }

    if (filters.hasRewards !== undefined) {
      filteredQuests = filteredQuests.filter(quest => {
        const hasRewards = quest.xpReward > 0 || quest.goldReward > 0 || 
                          quest.itemRewards.length > 0 || !!quest.rewards;
        return filters.hasRewards ? hasRewards : !hasRewards;
      });
    }

    if (filters.hasDependencies !== undefined) {
      filteredQuests = filteredQuests.filter(quest => {
        const hasDeps = quest.dependencies.length > 0;
        return filters.hasDependencies ? hasDeps : !hasDeps;
      });
    }

    if (filters.completedDateRange) {
      filteredQuests = filteredQuests.filter(quest => {
        if (!quest.completedAt) return false;
        const { start, end } = filters.completedDateRange!;
        if (start && quest.completedAt < start) return false;
        if (end && quest.completedAt > end) return false;
        return true;
      });
    }
  }

  return filteredQuests;
}

/**
 * Sorts quests based on criteria
 */
export function sortQuests(
  quests: EnhancedQuest[],
  sortBy: QuestSearchOptions['sortBy'] = 'title',
  sortOrder: QuestSearchOptions['sortOrder'] = 'asc',
  allQuests: EnhancedQuest[] = []
): EnhancedQuest[] {
  const sorted = [...quests].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'importance':
        const importanceOrder = { high: 3, medium: 2, low: 1 };
        comparison = importanceOrder[a.importance] - importanceOrder[b.importance];
        break;
      case 'status':
        const statusOrder = { active: 1, completed: 2, failed: 3 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
      case 'createdAt':
        comparison = (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
        break;
      case 'completedAt':
        comparison = (a.completedAt?.getTime() || 0) - (b.completedAt?.getTime() || 0);
        break;
      case 'progress':
        const progressA = calculateQuestProgress(a, allQuests).percentage;
        const progressB = calculateQuestProgress(b, allQuests).percentage;
        comparison = progressA - progressB;
        break;
      default:
        comparison = a.title.localeCompare(b.title);
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

/**
 * Creates a new milestone with default values
 */
export function createMilestone(
  title: string,
  description: string = '',
  order: number = 0
): Omit<QuestMilestone, 'id'> {
  return {
    title,
    description,
    completed: false,
    order,
  };
}

/**
 * Checks if a quest can be started based on its dependencies
 */
export function canStartQuest(
  quest: EnhancedQuest,
  allQuests: EnhancedQuest[]
): boolean {
  return quest.dependencies.every(depId => {
    const depQuest = allQuests.find(q => q.id === depId);
    return depQuest?.status === 'completed';
  });
}

/**
 * Gets all quests that depend on a given quest
 */
export function getDependentQuests(
  questId: string,
  allQuests: EnhancedQuest[]
): EnhancedQuest[] {
  return allQuests.filter(quest => quest.dependencies.includes(questId));
}
